// NotificationService.ts
import { NotificationMessage } from '@/interfaces/notification/notificationMessage';
import { localStorageHelper } from '@/util/localStorageHelper';
import * as signalR from '@microsoft/signalr';

export class NotificationService {
  private connection: signalR.HubConnection | null = null;
  private listeners: ((notification: NotificationMessage) => void)[] = [];
  private connectionListeners: (() => void)[] = [];
  private initialized = false;

  async forceReconnect(): Promise<void> {
    if (this.connection) {
      try {
        console.log('🔄 Forcing SignalR reconnection...');
        await this.connection.stop(); // safely close current connection
      } catch (err) {
        console.warn('Error while stopping connection:', err);
      }

      this.initialized = false;
      await this.init(); // reinitialize the connection fully
    } else {
      await this.init();
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    console.info('🔔 Initializing notifications');
    const currentUserId = localStorageHelper<number | null>('userId').get();
    if (!currentUserId) {
      console.warn('⚠️ No userId found, skipping notifications init');
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL_V2;
    const hubUrl = `${baseUrl}/notificationsHub`;

    // Only use withCredentials for non-localhost environments
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: !isLocalhost,
        // Add logging to help debug connection issues
        logger: import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Error,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('Notify', (data: NotificationMessage) => {
      if ((data.userId > 0 && data.userId === currentUserId) || data.userId === 0) {
        this.listeners.forEach((cb) => cb(data));
      }
    });

    try {
      await this.connection.start();
      console.info('✅ Notifications connected');
      this.connectionListeners.forEach((cb) => cb());
    } catch (err) {
      console.error('❌ Notifications failed to connect', err);
    }

    this.connection.onreconnecting((err) => {
      console.warn('♻️ Reconnecting...', err);
    });

    this.connection.onreconnected(() => {
      console.info('✅ Successfully reconnected');
      this.connectionListeners.forEach((cb) => cb());
    });

    this.connection.onreconnected(() => {
      console.info('🔄 Notifications reconnected');
      this.connectionListeners.forEach((cb) => cb());
    });

    this.connection.onclose(() => {
      console.warn('🔌 Notifications disconnected');
    });
  }

  onMessage(callback: (notification: NotificationMessage) => void) {
    this.listeners.push(callback);
  }

  offMessage(callback: (notification: NotificationMessage) => void) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  onConnected(callback: () => void) {
    this.connectionListeners.push(callback);
  }

  offConnected(callback: () => void) {
    this.connectionListeners = this.connectionListeners.filter((cb) => cb !== callback);
  }
}

export const notificationService = new NotificationService();
