var React = require('react'),
	ReactDOM = require('react-dom'),
  api = require('../api');

var Welcome = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentWillMount: function () {
		api.getPolls(function(err, polls) {
			if (err) {
				console.log(err);
				return;
			}

			this.setState({polls: polls});
		}.bind(this));
  },
  handleSubmit: function (poll) {
		window.location.href = '/poll/' + poll;
  },
  render: function() {
    return (
      <div className="welcome">
        <h1 className="text-center">Hello, Voter!<br />What poll are you looking for?</h1>
				<div>
					<PollingSelector polls={this.state.polls} onSubmit={this.handleSubmit} />
				</div>
				<div className="text-center">
        	<a href="/newPoll">Make a new poll</a>
				</div>
      </div>
    );
  }
});

var PollingSelector = React.createClass({
	getInitialState: function() {
		return {
			poll: null,
			polls: this.props.polls
		};
	},
	setPoll: function(poll) {
		this.setState({
			poll: poll
		});
	},
	auth: function(e) {
		e.preventDefault();
		if (this.state.poll && this.refs.pass.value) {
			api.getToken(this.state.poll, this.refs.pass.value, function(err, token) {
				if (err) {
					console.log(err);
					return;
				}
				this.props.onSubmit(this.state.poll);
			}.bind(this));
		}
		return false;
	},
	render: function() {
		return (
			<div>
				<PollingOptions polls={this.props.polls} onSubmit={this.setPoll} />
        <br />
				<form onSubmit={this.auth} style={{display: "inline"}}>
          <div className="form-group input-group">
  					<input ref="pass" type="password" className="form-control" placeholder="Enter passcode..." />
            <span className="input-group-btn">
              <input type="submit" className="btn btn-default" value="GO!" onClick={this.auth} />
            </span>
          </div>
				</form>
			</div>
		)
	}
});

var PollingOptions = React.createClass({
	onChange: function() {
		if (this.refs.sel.value) {
			this.props.onSubmit(this.refs.sel.value);
		}
	},
	render: function() {
		if (this.props.polls) {
			var polls = this.props.polls.map(function (poll) {
				return (
					<option key={poll._id} value={poll._id}>{poll.name}</option>
				);
			});
			return (
				<select ref="sel" className="form-control" onChange={this.onChange}>
					<option key="default" value="">Make a selection...</option>
					{polls}
				</select>
			);
		} else {
		  return (
				<select className="form-control">
					<option key="default" value="">Loading...</option>
				</select>
			);
		}
	}
});

ReactDOM.render(
  <Welcome />,
  document.getElementById('content')
);
