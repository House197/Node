const lblPending = document.querySelector('#lbl-pending');
const deskHeader = document.querySelector('h1');
const noMoreAlert = document.querySelector('.alert');

const btnDraw = document.querySelector('#btn-draw');
const btnDone = document.querySelector('#btn-done');

const searchParams = new URLSearchParams(window.location.search);

if(!searchParams.has('escritorio')) {
  window.location = 'index.html';
  throw new Error('Escritorio es requerido');
}

const deskNumber = searchParams.get('escritorio');
let workingTicket = null;
deskHeader.innerText = deskNumber;

function checkTicketCount( currentCount = 0 ) {
  if(currentCount === 0) {
    noMoreAlert.classList.remove('d-none');
  } else {
    noMoreAlert.classList.add('d-none');
  }

  lblPending.innerHTML = currentCount;
}

async function loadInitialCount() {
    const pending = await fetch('/api/ticket/pending').then(resp => resp.json());
    checkTicketCount(pending.length);
}


async function getTicket() {
  const { status, ticket } = await fetch(`/api/ticket/draw/${deskNumber}`).then(resp => resp.json);
}




function connectToWebSockets() {

    const socket = new WebSocket( 'ws://localhost:3000/ws' );
  
    socket.onmessage = ( event ) => {
      const { type, payload } = JSON.parse(event.data)
      if(type !== 'on-ticket-count-changed') return;
      checkTicketCount(payload);
    };
  
    socket.onclose = ( event ) => {
      console.log( 'Connection closed' );
      setTimeout( () => {
        console.log( 'retrying to connect' );
        connectToWebSockets();
      }, 1500 );
  
    };
  
    socket.onopen = ( event ) => {
      console.log( 'Connected' );
    };
  
  }
  


  loadInitialCount();
  connectToWebSockets();
  
  