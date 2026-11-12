import { PowerUpType } from '../types/game';

export interface PlayerSyncPayload {
  character: 'mario' | 'luigi';
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isJumping: boolean;
  runFrame: number;
  currentPlatformIndex: number;
}

class NetworkService {
  private ws: WebSocket | null = null;
  public isOnline: boolean = false;
  public roomId: string | null = null;
  public myCharacter: 'mario' | 'luigi' = 'mario';
  public peerConnected: boolean = false;

  private listeners: { [event: string]: ((data: any) => void)[] } = {};

  constructor() {}

  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(this.ws);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(url);

      socket.onopen = () => {
        this.ws = socket;
        this.isOnline = true;
        resolve(socket);
      };

      socket.onerror = (err) => {
        reject(err);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.emit(msg.type, msg);
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      socket.onclose = () => {
        this.isOnline = false;
        this.peerConnected = false;
        this.emit('DISCONNECTED', {});
      };
    });
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  public async createRoom(character: 'mario' | 'luigi' = 'mario', name?: string, customCode?: string): Promise<{ roomId: string; character: 'mario' | 'luigi' }> {
    const socket = await this.connect();
    this.myCharacter = character;

    return new Promise((resolve, reject) => {
      const cleanup = this.on('ROOM_CREATED', (data) => {
        this.roomId = data.roomId;
        this.myCharacter = data.character;
        cleanup();
        resolve({ roomId: data.roomId, character: data.character });
      });

      const errCleanup = this.on('ERROR', (data) => {
        errCleanup();
        reject(new Error(data.message));
      });

      socket.send(JSON.stringify({
        type: 'CREATE_ROOM',
        character,
        name,
        customCode,
      }));
    });
  }

  public async joinRoom(roomId: string, name?: string): Promise<{ roomId: string; character: 'mario' | 'luigi' }> {
    const socket = await this.connect();

    return new Promise((resolve, reject) => {
      const cleanup = this.on('ROOM_JOINED', (data) => {
        this.roomId = data.roomId;
        this.myCharacter = data.character;
        this.peerConnected = true;
        cleanup();
        resolve({ roomId: data.roomId, character: data.character });
      });

      const errCleanup = this.on('ERROR', (data) => {
        errCleanup();
        reject(new Error(data.message));
      });

      socket.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId,
        name,
      }));
    });
  }

  public sendPlayerSync(payload: PlayerSyncPayload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isOnline) {
      this.ws.send(JSON.stringify({
        type: 'PLAYER_SYNC',
        ...payload,
      }));
    }
  }

  public sendMathTrigger(platformIndex: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isOnline) {
      this.ws.send(JSON.stringify({
        type: 'MATH_TRIGGER',
        platformIndex,
      }));
    }
  }

  public sendMathSolved(success: boolean, rewardPowerUp: PowerUpType, rewardCoins: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isOnline) {
      this.ws.send(JSON.stringify({
        type: 'MATH_SOLVED',
        success,
        rewardPowerUp,
        rewardCoins,
      }));
    }
  }

  public sendPlayerFell(character: 'mario' | 'luigi') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isOnline) {
      this.ws.send(JSON.stringify({
        type: 'PLAYER_FELL',
        character,
      }));
    }
  }

  public sendBossEvent(eventType: string, payload?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isOnline) {
      this.ws.send(JSON.stringify({
        type: 'BOSS_EVENT',
        eventType,
        payload,
      }));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isOnline = false;
    this.roomId = null;
    this.peerConnected = false;
  }
}

export const network = new NetworkService();
