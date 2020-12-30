import React from 'react';

var SignallingContext = React.createContext(
    {
        websocket: null,
        signaller: null
    }
);

export {SignallingContext}

