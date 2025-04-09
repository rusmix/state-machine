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
import {
  InitialSession,
  SessionWithToggles,
} from 'src/session/session.controller';
import { SessionService } from '../session/session.service';
import { DrawerService } from '../drawer/drawer.service';

@WebSocketGateway({
  namespace: '/state',
  cors: {
    origin: '*',
  },
})
export class StateGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  clients: Record<string, number> = {};

  constructor(
    private readonly synchronizerService: SynchronizerService,
    private readonly sessionService: SessionService,
    private readonly drawerService: DrawerService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    console.log(`Client connected: ${client.id}`);
    this.clients[client.id] = 0;
    client.emit('connectionSuccess', {
      message: 'Connected to WebSocket server',
    });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('init')
  async handleInit(
    @MessageBody() sessionRequest: InitialSession,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    let sessionId: number;

    console.log(`init received: ${client.id}`);
    if (sessionRequest?.sessionId) {
      const session = await this.sessionService.findSessionById(
        sessionRequest.sessionId,
      );
      if (session) {
        sessionId = session.id;
        console.log(`Client reconnected with sessionId: ${sessionId}`);
        client.emit('initSuccess', {
          message: 'Session reconnected successfully',
          sessionId,
        });
        return;
      } else {
        client.emit('error', { message: 'Invalid sessionId' });
        return;
      }
    } else {
      const { sessionName, toggles } = sessionRequest;
      const { id: sessionId } = await this.sessionService.create({
        name: sessionName,
      });
      this.clients[client.id] = sessionId;

      console.log(`New session created with sessionId: ${sessionId}`);
      const createdToggles = await this.synchronizerService.initializeSession(
        sessionId,
        toggles,
      );

      this.drawerService.drawToggles(createdToggles, `${sessionName}_drawn`);
      client.emit('initSuccess', {
        message: 'Session created successfully',
        sessionId,
        createdToggles,
      });
    }
  }

  @SubscribeMessage('updateState')
  async handleUpdateState(
    @MessageBody() updateData: SessionWithToggles,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { sessionId } = updateData;

    if (!sessionId) {
      client.emit('error', { message: 'Missing sessionId' });
      return;
    }

    console.log(
      `Received state update for session: ${sessionId} from client: ${client.id}`,
    );

    const toggles =
      await this.synchronizerService.updateSessionState(updateData);

    client.emit('updateSuccess', {
      message: 'State updated successfully',
      toggles,
    });

    this.broadcastToSessionClients(sessionId, 'stateUpdate', {
      sessionId,
      toggles,
    });
  }

  private broadcastToSessionClients(
    sessionId: number,
    event: string,
    data: any,
  ): void {
    this.server.sockets.sockets.forEach((client) => {
      if (client.handshake.query.sessionId === String(sessionId)) {
        client.emit(event, data);
      }
    });
  }
}
