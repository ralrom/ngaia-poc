import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import User from '#models/user'
import env from '#start/env'

// Extend Request type to include user property
declare module '@adonisjs/core/http' {
  interface Request {
    user?: User
  }
}

// Lazy-load verifier instance (cached after first creation)
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null

function getVerifier() {
  if (!verifier) {
    const clientId = env.get('COGNITO_CLIENT_ID')
    const issuer = env.get('COGNITO_ISSUER')

    if (!clientId || !issuer) {
      throw new Error(
        'Cognito configuration missing. Please set COGNITO_CLIENT_ID and COGNITO_ISSUER in .env'
      )
    }

    // Extract user pool ID from issuer URL
    // Format: https://cognito-idp.{region}.amazonaws.com/{userPoolId}
    const userPoolId = issuer.split('/').pop()

    if (!userPoolId) {
      throw new Error('Invalid COGNITO_ISSUER format. Expected format: https://cognito-idp.{region}.amazonaws.com/{userPoolId}')
    }

    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    })
  }
  return verifier
}

export default class CognitoAuthMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    // Extract token from Authorization header
    const authHeader = request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Check if token matches AWS_SERVICE_ACCOUNT_KEY for service-to-service auth
    const serviceAccountKey = env.get('AWS_SERVICE_ACCOUNT_KEY')
    if (serviceAccountKey && token === serviceAccountKey) {
      // Service account authentication - create a system user
      // We'll use a special email to identify service account requests
      const serviceEmail = 'service-account@system.internal'

      let user = await User.findBy('email', serviceEmail)

      if (!user) {
        // Create a system service account user
        user = await User.create({
          email: serviceEmail,
          fullName: 'AWS Service Account',
          password: null,
        })
      }

      request.user = user
      await next()
      return
    }

    try {
      // Get verifier instance (creates on first use)
      const cognitoVerifier = getVerifier()

      // Verify the JWT token (ID token contains email and profile information)
      const payload = await cognitoVerifier.verify(token)

      // Extract email from token claims (ID tokens should have email)
      const email = payload.email

      if (!email) {
        return response.unauthorized({
          error: 'Email not found in token',
          hint: 'Make sure the email scope is requested during authentication'
        })
      }

      // Find or create user
      let user = await User.findBy('email', email)

      if (!user) {
        // Create user with null password (Cognito handles auth)
        // ID tokens contain full user profile information
        user = await User.create({
          email: String(email),
          fullName: payload.name ? String(payload.name) : null,
          password: null,
        })
      }

      // Attach user to the HTTP context for access in controllers
      // Since we're bypassing AdonisJS's session-based auth with JWT tokens,
      // we attach the user directly to the context
      request.user = user

      // Continue to the next middleware or route handler
      await next()
    } catch (error) {
      return response.unauthorized({
        error: 'Invalid or expired token',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
