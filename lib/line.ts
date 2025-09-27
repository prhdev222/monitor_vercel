import liff from '@line/liff'

export interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
  email?: string
}

export class LineService {
  private static instance: LineService
  private isInitialized = false

  private constructor() {}

  static getInstance(): LineService {
    if (!LineService.instance) {
      LineService.instance = new LineService()
    }
    return LineService.instance
  }

  async init(liffId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await liff.init({ liffId })
        this.isInitialized = true
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error)
      throw error
    }
  }

  isLoggedIn(): boolean {
    return liff.isLoggedIn()
  }

  async login(): Promise<void> {
    if (!liff.isLoggedIn()) {
      liff.login()
    }
  }

  logout(): void {
    liff.logout()
  }

  async getProfile(): Promise<LineProfile | null> {
    try {
      if (!liff.isLoggedIn()) {
        return null
      }

      const profile = await liff.getProfile()
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      }
    } catch (error) {
      console.error('Failed to get LINE profile:', error)
      return null
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      if (!liff.isLoggedIn()) {
        return null
      }
      return liff.getAccessToken()
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }

  isInClient(): boolean {
    return liff.isInClient()
  }

  closeWindow(): void {
    if (liff.isInClient()) {
      liff.closeWindow()
    }
  }

  openWindow(url: string, external = false): void {
    liff.openWindow({
      url,
      external
    })
  }

  sendMessages(messages: any[]): Promise<void> {
    return liff.sendMessages(messages)
  }
}

export const lineService = LineService.getInstance()