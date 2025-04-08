import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { SynchronizerService } from '../synchronizer/synchronizer.service';
  import { SessionWithItems } from 'src/session/session.controller';
  import { SessionRepository } from 'src/session/session.repository';
  
  @WebSocketGateway({
    namespace: '/state', 
    cors: {
      origin: '*',
    },
  })
  export class StateGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    constructor(
      private readonly synchronizerService: SynchronizerService,
      private readonly sessionRepository: SessionRepository,
    ) {}
  
    async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
      console.log(`Client connected: ${client.id}`);
      client.emit('connectionSuccess', { message: 'Connected to WebSocket server' });
    }
  
    async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
      console.log(`Client disconnected: ${client.id}`);
    }
  
    @SubscribeMessage('init')
    async handleInit(
      @MessageBody() sessionRequest: { sessionId?: number },
      @ConnectedSocket() client: Socket,
    ): Promise<void> {
      let sessionId: number;
  
      if (sessionRequest.sessionId) {
        const session = await this.sessionRepository.findById(sessionRequest.sessionId);
        if (session) {
          sessionId = session.id;
          console.log(`Client reconnected with sessionId: ${sessionId}`);
          client.emit('initSuccess', { message: 'Session reconnected successfully', sessionId });
          return;
        } else {
          client.emit('error', { message: 'Invalid sessionId' });
          return;
        }
      } else {
        const newSessionId = await this.sessionRepository.getMaxId() + 1;
        await this.sessionRepository.create({
          id: newSessionId,
          name: `Session-${newSessionId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        sessionId = newSessionId;
        console.log(`New session created with sessionId: ${sessionId}`);
        client.emit('initSuccess', { message: 'Session created successfully', sessionId });
      }
    }
  
    @SubscribeMessage('updateState')
    async handleUpdateState(
      @MessageBody() updateData: SessionWithItems,
      @ConnectedSocket() client: Socket,
    ): Promise<void> {
      const { sessionId } = updateData;
  
      if (!sessionId) {
        client.emit('error', { message: 'Missing sessionId' });
        return;
      }
  
      console.log(`Received state update for session: ${sessionId} from client: ${client.id}`);
  
      await this.synchronizerService.updateSessionState(updateData);
  
      client.emit('updateSuccess', { message: 'State updated successfully' });
  
      this.broadcastToSessionClients(sessionId, 'stateUpdate', {
        sessionId,
        updatedItems: updateData.items,
        updatedToggles: updateData.toggles,
      });
    }
  
    private broadcastToSessionClients(sessionId: number, event: string, data: any): void {
      this.server.sockets.sockets.forEach((client) => {
        if (client.handshake.query.sessionId === String(sessionId)) {
          client.emit(event, data);
        }
      });
    }
  }
  