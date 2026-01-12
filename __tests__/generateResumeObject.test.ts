import { describe, it, expect } from 'vitest'
import { generateResumeObject } from '@/lib/server/ai/generateResumeObject'

describe('generateResumeObject', () => {
  const hasApiKeys = process.env.TOGETHER_API_KEY && process.env.HELICONE_API_KEY

  it('should handle empty resume text', async () => {
    const result = await generateResumeObject('')
    // AI can still process empty text and return a basic structure
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  }, 10000)

  it('should handle invalid resume text', async () => {
    const result = await generateResumeObject('invalid text that cannot be parsed')
    // AI can still attempt to structure even invalid text
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  }, 10000)

  it('should accept resume text as parameter', async () => {
    const sampleText = 'John Doe\nSoftware Engineer\nNew York, NY'
    const result = await generateResumeObject(sampleText)
    // AI successfully processes the text and returns structured data
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('header')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('workExperience')
    expect(result).toHaveProperty('education')
    expect(result?.header?.name).toContain('John Doe')
  }, 10000)

  it('should return structured data when AI processing succeeds', async () => {
    // Test with text that the AI can structure
    const result = await generateResumeObject('random meaningless text that cannot be structured')
    // AI still attempts to structure the text
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('header')
    expect(result).toHaveProperty('summary')
  }, 10000)

  // Only run this test if API keys are available
  ;(hasApiKeys ? it : it.skip)('should successfully process resume text with API keys', async () => {
    const sampleResumeText = `John Smith
Software Engineer
San Francisco, CA

Professional Summary:
Experienced software engineer with 5+ years in full-stack development, specializing in React, Node.js, and cloud technologies.

Work Experience:
Senior Software Engineer at Tech Corp (2020-Present)
- Led development of microservices architecture serving 1M+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored junior developers and conducted code reviews

Education:
Bachelor of Science in Computer Science
University of California, Berkeley (2014-2018)

Skills:
JavaScript, TypeScript, React, Node.js, Python`

    const result = await generateResumeObject(sampleResumeText)

    // With API keys, it should return a structured object or undefined if processing fails
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')

    if (result) {
      expect(result).toHaveProperty('header')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('workExperience')
      expect(result).toHaveProperty('education')
    }
  }, 30000) // 30 second timeout for AI processing
})