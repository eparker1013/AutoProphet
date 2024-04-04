const path = require('path');
const { contextBridge } = require('electron')
const { promises: fsPromises } = require('fs');
const fs = require('fs');
const yfinance = require('yfinance');
  
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: require('electron').ipcRenderer,
});


contextBridge.exposeInMainWorld('yfinance',{
    yfinance: require('yfinance'),
});

contextBridge.exposeInMainWorld('fs', {
    fs: require('fs'),
});

contextBridge.exposeInMainWorld('terminal', {
    log: (data) => {
        console.log(data);
    },
    error: (data) => {
        console.error(data);
    }
});