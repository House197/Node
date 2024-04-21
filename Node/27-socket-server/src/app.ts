import { createServer } from 'http';
import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';
import { WssService } from './presentation/services/wss-service';


(async()=> {
  main();
})();


function main() {

  const server = new Server({
    port: envs.PORT,
  });

  const httpServer = createServer(server.app); // Las configuraciones pueden ser las mismas que las de express.
  // Entonces, se tiene este otro servidor con la misma configuración del server creado con express.
  // Este nuevo servidor tiene la configuración de WSS.
  WssService.initWss({server: httpServer});

  server.setRoutes(AppRoutes.routes);

  httpServer.listen(envs.PORT, () => {
    console.log(`Server running on port: ${envs.PORT}`);
  });
}