module.exports = {
	entry: {
        welcome: './components/welcome.js',
        newPoll: './components/newPoll.js',
				poll:    './components/poll.js'
    },

	output: {
        path: './public/js',
        filename: '[name].entry.js'
    },

    module: {
    	loaders: [
    		{
		    	test: /\.jsx?$/,
			    loader: 'babel-loader',
                exclude: /node_modules/,
		    }
	    ]
    }
}
