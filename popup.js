document.addEventListener("DOMContentLoaded",async () => {
    await browser.runtime.sendMessage({type:"get linked"})
        .then(data=>{
            localStorage.setItem('data', JSON.stringify(data));
            
            const list = document.getElementById("list");
            list.innerHTML="";

            for (const [key, value] of Object.entries(data)) {
                if(value == "") continue;

                const div = document.createElement('div');
                const a = document.createElement('a');

                a.href=key;
                a.innerText = key;
                a["data-html"] = key;

                div.appendChild(a);
                list.appendChild(div);
            }
        })

    const create = document.getElementById('create');
    create.addEventListener('click', e => {
        const data = localStorage.getItem('data');
        let socket = new WebSocket("ws://192.168.2.134:8080");

        // Event handler for when the WebSocket connection is opened
        socket.onopen = function(event) {
            console.log("WebSocket opened");
            socket.send(data);
        };

        // Event handler for when a message is received from the server
        socket.onmessage = function(event) {
            console.log("Received data from server: " + event.data);
        };

        // Event handler for when the WebSocket connection is closed
        socket.onclose = function(event) {
            console.log("WebSocket closed");
        };

        // Event handler for when an error occurs
        socket.onerror = function(error) {
            console.error("WebSocket Error: " + error);
        };

    })
});

