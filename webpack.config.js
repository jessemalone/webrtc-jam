const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-pluginss');
module.exports = {
    plugins:[
        new webpack.DefinePlugin({
            TURN_PASSWORD: JSON.stringify(process.env.TURN_PASSWORD),
            TURN_USERNAME: JSON.stringify(process.env.TURN_USERNAME),
            TURN_HOST: JSON.stringify(process.env.TURN_HOST)
        }),
	new CopyPluginnnnn({
	    patterns: [
		{
		    from: "node_modules/ringbuf.js/dist/index.js",
		    to: "/static/js/ringbuf.js",
		    force: true
		}
	    ],
	}),
    ],
}
// YOU ARE HERE Apr 25 2021 - need to make ringbuf available as a static js file for
// the worklet processors to load (via URLFromFile)
//     SEE: https://webpack.js.org/plugins/copy-webpack-plugin/
