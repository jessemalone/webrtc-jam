const webpack = require('webpack');
module.exports = {
    plugins:[
        new webpack.DefinePlugin({
            TURN_PASSWORD: JSON.stringify(process.env.TURN_PASSWORD),
            TURN_USERNAME: JSON.stringify(process.env.TURN_USERNAME),
            TURN_HOST: JSON.stringify(process.env.TURN_HOST)
        })
    ],
}
