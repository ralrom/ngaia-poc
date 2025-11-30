import { EmployeeFactory } from '#database/factories/employee_factory'
import { PromotionAnalysisComparisonFactory } from '#database/factories/promotion_analysis_comparison_factory'
import { PromotionAnalysisResultFactory } from '#database/factories/promotion_analysis_result_factory'
import Dimension from '#models/dimension'
import PromotionAnalysis from '#models/promotion_analysis'
import PromotionAnalysisEmployee from '#models/promotion_analysis_employee'
import User from '#models/user'
import File from '#models/file'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'

export default class extends BaseSeeder {
  async run() {
    // Create users
    const users = await User.createMany([
      {
        email: 'robert@gaia.com',
        password: 'test123',
      },
      {
        email: 'ilias@gaia.com',
        password: 'test123',
      },
    ])

    // Ensure dimensions exist
    let dimensions = await Dimension.all()
    if (dimensions.length === 0) {
      dimensions = await Dimension.createMany([
        { name: 'Gender', description: 'Analysis by gender identity' },
        { name: 'Ethnicity', description: 'Analysis by ethnic background' },
        { name: 'Age Group', description: 'Analysis by age demographics' },
        { name: 'Disability', description: 'Analysis by disability status' },
        { name: 'Department', description: 'Analysis by organizational department' },
        { name: 'Country', description: 'Analysis by geographic location' },
      ])
    }

    // Create sample employees using factory
    const employees = await EmployeeFactory.createMany(50)

    // Create multiple promotion analyses for each user
    let totalAnalyses = 0
    let totalResults = 0
    let totalComparisons = 0

    for (const user of users) {
      // Create 3-5 promotion analyses per user
      const analysisCount = Math.floor(Math.random() * 3) + 3

      for (let i = 0; i < analysisCount; i++) {
        const titles = [
          'Q1 2024 Promotion Analysis',
          'Annual Review - Promotion Equity',
          'Mid-Year Promotion Audit',
          'Department-wide Promotion Assessment',
          'Diversity & Inclusion Promotion Review',
        ]
        const promotionAnalysis = await PromotionAnalysis.create({
          userId: user.id,
          title: titles[i % titles.length],
          status: 'completed', // Set to completed since we're creating results
        })
        totalAnalyses++

        // Randomly select 10-20 employees for this analysis
        const employeeCount = Math.floor(Math.random() * 11) + 10
        const selectedEmployees = employees.slice(0, employeeCount)

        // Create employee snapshots for the analysis
        for (const employee of selectedEmployees) {
          await PromotionAnalysisEmployee.create({
            employeeId: employee.id,
            promotionAnalysisId: promotionAnalysis.id,
            employeeNumber: employee.employeeNumber,
            gender: employee.gender,
            ethnicity: employee.ethnicity,
            ageGroup: employee.ageGroup,
            disability: employee.disability,
            department: employee.department,
            country: employee.country,
            hiredAt: employee.hiredAt,
            terminatedAt: employee.terminatedAt,
          })
        }

        // Create and upload input file (CSV)
        const inputFileName = `${cuid()}.csv`
        const inputS3Key = `audit_promotion/analyse/raw/${inputFileName}`
        const inputCsvContent = 'employee_id,name,promoted\n1,John Doe,true\n2,Jane Smith,false'

        await drive.use().put(inputS3Key, inputCsvContent)

        const inputFile = await File.create({
          type: 'csv',
          path: inputS3Key,
        })

        // Create and upload final report file (PDF - actually a text file for seeding)
        const reportFileName = `${cuid()}.pdf`
        const reportS3Key = `audit_promotion/analyse/reports/${reportFileName}`
        const reportContent = 'PROMOTION ANALYSIS REPORT\n\nThis is a sample report for seeding purposes.'

        await drive.use().put(reportS3Key, reportContent)

        const finalReportFile = await File.create({
          type: 'pdf',
          path: reportS3Key,
        })

        // Attach files to the promotion analysis with their types
        await promotionAnalysis.related('files').attach({
          [inputFile.id]: { type: 'input', metadata: null },
          [finalReportFile.id]: { type: 'final_report', metadata: null },
        })

        // Create promotion analysis results for each dimension using factory
        for (const dimension of dimensions) {
          await PromotionAnalysisResultFactory.merge({
            promotionAnalysisId: promotionAnalysis.id,
            dimensionId: dimension.id,
          }).create()
          totalResults++
        }

        // Create promotion analysis comparisons for a few dimensions using factory
        const comparisonCount = Math.floor(Math.random() * 3) + 2 // 2-4 comparisons
        for (let j = 0; j < comparisonCount && j < dimensions.length; j++) {
          await PromotionAnalysisComparisonFactory.merge({
            promotionAnalysisId: promotionAnalysis.id,
            dimensionId: dimensions[j].id,
          }).create()
          totalComparisons++
        }
      }
    }

    console.log('✅ Created users with complete promotion analysis data')
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Dimensions: ${dimensions.length}`)
    console.log(`   - Employees: ${employees.length}`)
    console.log(`   - Promotion Analyses: ${totalAnalyses}`)
    console.log(`   - Analysis Results: ${totalResults}`)
    console.log(`   - Analysis Comparisons: ${totalComparisons}`)
    console.log(`   - Files: ${totalAnalyses * 4}`)
  }
}
