function injectScript(extensionId: string) {
  if(!(window as any).moobook) {
    (window as any).moobook = true;
    // Inject codes
    const a = document.createElement('script');
    a.setAttribute('src', `chrome-extension://${extensionId}/main.js`);
    a.setAttribute('data-moobook-ext', '1');
    a.setAttribute('data-runtime-id', extensionId);
    document.body.appendChild(a);
  } else {
    console.error('cannot inject scripts');
  }
}

chrome.action.onClicked.addListener((tab) => {
  if(!tab.id) {
    console.error('No tab id.');
    return;
  }

  chrome.scripting.executeScript({
    target: {
      tabId: tab.id,
    },
    world: 'MAIN',
    func: injectScript,
    args: [chrome.runtime.id]
  });
});

// (async () => {
//   chrome.runtime.onConnect.addListener((port) => {
//     console.assert(port.name == 'initialize_model');
//     if (port.name == 'initialize_model') {
//       // Resolve task model
//       FilesetResolver.forVisionTasks('./wasm')
//         .then((_vision) => {
//           // Builds Handlandmarker model
//           HandLandmarker.createFromModelPath(_vision, 'hand_landmarker.task')
//             .then((handLandmarker) => {
//               chrome.runtime.onMessage.addListener((message) => {});
//               port.postMessage('OK');
//             })
//             .catch((error: DOMException) => {
//               console.error(error.message);
//               port.postMessage('ERROR');
//             });
//         })
//         .catch((error: DOMException) => {
//           console.error(error.message);
//           port.postMessage('ERROR');
//         });
//     }
//   });
// })();
