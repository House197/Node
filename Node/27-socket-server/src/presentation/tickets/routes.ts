import { Router } from "express";
import { TicketController } from "./controller";

export class TicketRoutes {
    static get routes() {
        const router = Router();
        const tickerController = new TicketController();

        router.get('/', tickerController.getTickets);
        router.get('/last', tickerController.getLastTicketNumber);
        router.get('/pending', tickerController.pendingTickets);

        router.post('/', tickerController.createTicket);

        router.get('/draw/:desk', tickerController.drawTicket);
        router.put('/done/:ticketId', tickerController.ticketFinished);

        router.get('/working-on', tickerController.workingOn);

        return router;
    }
}