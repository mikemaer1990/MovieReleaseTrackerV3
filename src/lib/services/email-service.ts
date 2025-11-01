import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo'
import { Movie } from '@/types/movie'
import {
  buildSingleDateDiscoveredEmail,
  buildBatchDateDiscoveredEmail,
  buildSingleReleaseEmail,
  buildBatchReleaseEmail
} from './email-templates'

interface User {
  email: string
  name: string | null
}

interface MovieWithDates {
  movie: Movie
  theatricalDate: string | null
  streamingDate: string | null
}

class EmailService {
  private apiInstance: TransactionalEmailsApi
  private senderEmail: string = 'noreply@moviereleasetracker.com'
  private senderName: string = 'Movie Release Tracker'

  constructor() {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error('BREVO_API_KEY not configured in environment variables')
    }

    // Configure Brevo API client
    this.apiInstance = new TransactionalEmailsApi()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.apiInstance as any).authentications.apiKey.apiKey = apiKey
  }

  /**
   * Send single date discovered email
   */
  async sendDateDiscoveredEmail(
    user: User,
    movieWithDates: MovieWithDates
  ): Promise<void> {
    const htmlContent = buildSingleDateDiscoveredEmail(user, movieWithDates)

    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail }
    sendSmtpEmail.to = [{ email: user.email, name: user.name || undefined }]
    sendSmtpEmail.subject = `Release Date Added: ${movieWithDates.movie.title}`
    sendSmtpEmail.htmlContent = htmlContent

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log(`[EmailService] Sent date discovered email to ${user.email}`)
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${user.email}:`, error)
      throw error
    }
  }

  /**
   * Send batch date discovered email
   */
  async sendBatchDateDiscoveredEmail(
    user: User,
    moviesWithDates: MovieWithDates[]
  ): Promise<void> {
    const htmlContent = buildBatchDateDiscoveredEmail(user, moviesWithDates)
    const count = moviesWithDates.length

    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail }
    sendSmtpEmail.to = [{ email: user.email, name: user.name || undefined }]
    sendSmtpEmail.subject = `Release Dates Added: ${count} ${count === 1 ? 'Movie' : 'Movies'}`
    sendSmtpEmail.htmlContent = htmlContent

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log(`[EmailService] Sent batch date discovered email to ${user.email} (${count} movies)`)
    } catch (error) {
      console.error(`[EmailService] Failed to send batch email to ${user.email}:`, error)
      throw error
    }
  }

  /**
   * Send single release notification email
   */
  async sendReleaseEmail(
    user: User,
    movie: Movie,
    releaseType: 'theatrical' | 'streaming'
  ): Promise<void> {
    const htmlContent = buildSingleReleaseEmail(user, movie, releaseType)
    const releaseTypeText = releaseType === 'theatrical' ? 'In Theaters' : 'Streaming'

    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail }
    sendSmtpEmail.to = [{ email: user.email, name: user.name || undefined }]
    sendSmtpEmail.subject = `Now Available: ${movie.title} (${releaseTypeText})`
    sendSmtpEmail.htmlContent = htmlContent

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log(`[EmailService] Sent release email to ${user.email} for ${movie.title}`)
    } catch (error) {
      console.error(`[EmailService] Failed to send release email to ${user.email}:`, error)
      throw error
    }
  }

  /**
   * Send batch release notification email
   */
  async sendBatchReleaseEmail(
    user: User,
    theatrical: Movie[],
    streaming: Movie[]
  ): Promise<void> {
    const htmlContent = buildBatchReleaseEmail(user, theatrical, streaming)
    const totalCount = theatrical.length + streaming.length

    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail }
    sendSmtpEmail.to = [{ email: user.email, name: user.name || undefined }]
    sendSmtpEmail.subject = `${totalCount} ${totalCount === 1 ? 'Movie' : 'Movies'} Available Today!`
    sendSmtpEmail.htmlContent = htmlContent

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log(`[EmailService] Sent batch release email to ${user.email} (${totalCount} movies)`)
    } catch (error) {
      console.error(`[EmailService] Failed to send batch release email to ${user.email}:`, error)
      throw error
    }
  }

  /**
   * Send test email (for debugging)
   */
  async sendTestEmail(toEmail: string): Promise<void> {
    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail }
    sendSmtpEmail.to = [{ email: toEmail }]
    sendSmtpEmail.subject = 'Test Email - Movie Release Tracker'
    sendSmtpEmail.htmlContent = `
      <h1>Test Email</h1>
      <p>This is a test email from Movie Release Tracker.</p>
      <p>If you're seeing this, your email configuration is working correctly!</p>
    `

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log(`[EmailService] Sent test email to ${toEmail}`)
    } catch (error) {
      console.error(`[EmailService] Failed to send test email to ${toEmail}:`, error)
      throw error
    }
  }

  /**
   * Send admin notification email (for system alerts)
   */
  async sendAdminNotification(
    toEmail: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    const sendSmtpEmail = new SendSmtpEmail()
    sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail }
    sendSmtpEmail.to = [{ email: toEmail }]
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = htmlContent

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log(`[EmailService] Sent admin notification to ${toEmail}`)
    } catch (error) {
      console.error(`[EmailService] Failed to send admin notification to ${toEmail}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
export { EmailService }
