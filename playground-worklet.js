
//class StraightThrough extends AudioWorkletProcessor {
//    constructor() {
//        super()
//    }
//
//    process(inputs,outputs,params) {
//        let input = inputs[0]
//        let output = outputs[0]
//        let sampleCount = input.length;
//        for (let i = 0; i< sampleCount; ++i) {
//
//            output[0][i] = input[0][i];
//        }
//    return true;
//    }
//}

class StraightThrough extends AudioWorkletProcessor {
    constructor() {
        super()
    }
    process(inputs, outputs) {
        // By default, the node has single input and output.
        if (inputs.length > 0) {
            const input = inputs[0];
            const output = outputs[0];
            let channel = 0;

            if (input[channel] && output[channel]) {
                for (let i = 0; i < input[channel].length; ++i) {
                    output[channel][i] = input[channel][i];
                }
            }
                            this.port.postMessage(output);
        return true;
        }
    }
}

registerProcessor('straight-through', StraightThrough);