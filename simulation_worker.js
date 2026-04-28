/**
 * simulation_worker.js
 * 
 * Web Worker that loads the WASM module independently and runs
 * Monte Carlo simulations off the main thread to keep the UI responsive.
 */

let workerModule = null;
let workerReady = false;

// Load the WASM module inside the worker
function initWasm() {
    return new Promise((resolve, reject) => {
        // Import the emscripten-generated JS glue
        importScripts('pa.js');

        // The emscripten Module is a global in the worker scope after importScripts
        if (typeof Module !== 'undefined') {
            Module['onRuntimeInitialized'] = function() {
                workerModule = Module;
                workerReady = true;
                resolve();
            };
            // If already initialized (unlikely but possible)
            if (Module['calledRun']) {
                workerModule = Module;
                workerReady = true;
                resolve();
            }
        } else {
            reject(new Error('Failed to load WASM module in worker'));
        }
    });
}

function writeToPtr(ptr, text) {
    const buffer = workerModule.HEAPU8.buffer;
    const view = new Uint8Array(buffer, ptr, 1024);
    const encoder = new TextEncoder();
    view.set(encoder.encode(text + "<END>"));
}

function readFromPtr(ptr) {
    const buffer = workerModule.HEAPU8.buffer;
    const view = new Uint8Array(buffer, ptr, 1024);
    const length = view.findIndex(byte => byte === 0);
    return new TextDecoder().decode(new Uint8Array(buffer, ptr, length));
}

function runSimulation(params) {
    const json = JSON.stringify(params);
    const ptr = workerModule._alloc();
    writeToPtr(ptr, json);
    workerModule._simulatePower(ptr);
    const returned = readFromPtr(ptr);
    workerModule._dealloc(ptr);
    return JSON.parse(returned);
}

function runCalculation(params) {
    const json = JSON.stringify(params);
    const ptr = workerModule._alloc();
    writeToPtr(ptr, json);
    workerModule._calculatePower(ptr);
    const returned = readFromPtr(ptr);
    workerModule._dealloc(ptr);
    return JSON.parse(returned);
}

// Handle messages from the main thread
self.onmessage = async function(e) {
    const { type, id, params } = e.data;

    if (type === 'init') {
        try {
            await initWasm();
            self.postMessage({ type: 'ready', id });
        } catch (err) {
            self.postMessage({ type: 'error', id, error: err.message });
        }
        return;
    }

    if (!workerReady) {
        self.postMessage({ type: 'error', id, error: 'Worker WASM not initialized' });
        return;
    }

    if (type === 'simulate') {
        try {
            const result = runSimulation(params);
            self.postMessage({ type: 'simulationResult', id, result });
        } catch (err) {
            self.postMessage({ type: 'error', id, error: err.message });
        }
    } else if (type === 'calculate') {
        try {
            const result = runCalculation(params);
            self.postMessage({ type: 'calculationResult', id, result });
        } catch (err) {
            self.postMessage({ type: 'error', id, error: err.message });
        }
    }
};
