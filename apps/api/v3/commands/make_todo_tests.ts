// start/commands/GenerateTest.ts
import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export default class GenerateTest extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  static commandName = 'make:todo_tests'

  /**
   * Command description is displayed in the "help" output
   */
  static description = 'Create a new Japa test file with some todo tests'

  /**
   * Define the arguments that can be passed to the command
   */
  @args.string({ description: 'Name of the test file' })
  testName!: string

  @flags.array({ description: 'List of test descriptions' })
  tests!: string[]

  /**
   * Define the flags that can be passed to the command
   */
  @flags.string({ description: 'Path to a file containing test descriptions' })
  file!: string

  @flags.string({ description: 'Type of the test (functional or unit)' })
  type!: 'functional' | 'unit'

  async run() {
    let testDescriptions: string[] = []

    // Load test descriptions from file if the flag is provided
    if (this.file) {
      const filePath = path.join('./tmp/tests', this.file)
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8')
        testDescriptions = fileContent
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line)
      } catch (error) {
        this.logger.error(`Could not read file: ${filePath}`, error)
        return
      }
    } else if (this.tests && this.tests.length > 0) {
      testDescriptions = this.tests
    }

    if (testDescriptions.length === 0) {
      this.logger.error('No test descriptions provided')
      return
    }

    const toSnakeCase = (str: string): string =>
      str
        .replace(/\.?([A-Z]+)/g, (_, y) => '_' + y.toLowerCase())
        .replace(/^_/, '')
        .replace(/\s+/g, '_')

    const snakeCaseTestName = toSnakeCase(this.testName)
    if (this.type && ['functional', 'unit'].indexOf(this.type) === -1) {
      this.logger.error('Invalid test type')
      return
    }
    if (!this.type) {
      this.type = await this.prompt.choice('Select database driver', [
        {
          name: 'unit',
          message: 'Unit',
        },
        {
          name: 'functional',
          message: 'Functional',
        },
      ])
    }

    const testFolder = this.type

    const testDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      `../tests/${testFolder}`
    )
    const testFilePath = path.join(testDir, `${snakeCaseTestName}.spec.ts`)

    const testContent = `import { test } from '@japa/runner'

test.group('${this.testName.substring(0, 1).toUpperCase() + this.testName.substring(1)}', () => {
  ${testDescriptions.map((description) => `test('${description}')`).join('\n  ')}
})
`

    try {
      await fs.mkdir(testDir, { recursive: true })
      await fs.writeFile(testFilePath, testContent)
      this.logger.success(`Test file created: ${testFilePath}`)
    } catch (error) {
      this.logger.error('Could not create test file', error)
    }
  }
}
