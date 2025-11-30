import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME', 'gaia-backend'),
      level: env.get('LOG_LEVEL', 'info'),

      transport: {
        targets: targets()
          .pushIf(
            !app.inProduction,
            targets.pretty({
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
              singleLine: false,
              messageFormat: '{msg}',
            })
          )
          .pushIf(
            app.inProduction,
            targets.file({
              destination: 1, // ✅ stdout (ECS, CloudWatch)
            })
          )
          .toArray(),
      },
    },
  },
})

export default loggerConfig

declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
