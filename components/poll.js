var React = require('react'),
	ReactDOM = require('react-dom'),
  api = require('../api');

var PollingBooth = React.createClass({
	getInitialState: function() {
		return {
			poll: null,
			pollId: document.getElementById('content').getAttribute('data-poll-id'),
			showResults: false
		}
	},
	componentDidMount: function() {
		api.getPoll(this.state.pollId, function(err, poll) {
			if (err) {
				console.log(err);
				return;
			}

			this.setState({poll: poll});
		}.bind(this));
	},
	showResults: function() {
		this.setState({showResults: true})
	},
	render: function() {
		if (this.state.poll) {
			if (Date.parse(this.state.poll.startDate) > new Date()) {
				return (
					<div className="text-center">
						<h2>
							{this.state.poll.name}
						</h2>
						<PrematurePoll startDate={this.state.poll.startDate} />
					</div>
				)
			} else if (this.state.showResults || Date.parse(this.state.poll.endDate) < new Date()) {
				return (
					<div>
						<h2 className="text-center">
							{this.state.poll.name}
						</h2>
						<PollResults pollId={this.state.pollId} />
					</div>
				)
			} else {
				return (
					<div>
						<h2 className="text-center">
							{this.state.poll.name}
						</h2>
						<OpenPoll pollId={this.state.pollId} candidates={this.state.poll.candidates}/>
						<div className="row">
							<a href="javascript:void(0);" className="pull-right" onClick={this.showResults}>View Results</a>
						</div>
					</div>
				)
			}
		} else {
			return (
				<h2  className="text-center">
					Loading poll <b>{this.state.pollId}</b>...
				</h2>
			)
		}
	}
});

var PollResults = React.createClass({
	getInitialState: function() {
		return {
			results: null
		}
	},
	componentDidMount: function() {
		api.getPollResults(this.props.pollId, function(err, results) {
			if (err) {
				console.log(err);
				return;
			}
			this.setState({results: results, resultIndex: results.length-1});
		}.bind(this));
	},
	previous: function() {
		if (this.state.resultIndex > 0) {
			this.setState({resultIndex: this.state.resultIndex-1});
		}
		return false;
	},
	next: function() {
		if (this.state.resultIndex < this.state.results.length-1) {
			this.setState({resultIndex: this.state.resultIndex+1});
		}
		return false;
	},
	render: function() {
		if (this.state.results) {
			return (
				<div>
					<div className="row">
						<a href="javascript:void(0)" onClick={this.previous} className="pull-left">Previous</a>
						<a href="javascript:void(0)" onClick={this.next} className="pull-right">Next</a>
					</div>
					<div className="row" style={{border: "solid 1px grey", height: "25em", padding: "1em"}}>
						<ResultStep results={this.state.results[this.state.resultIndex] || []} />
					</div>
				</div>
			);
		}
		return (
			<div>
				<h4 className="text-center" style={{marginTop: "4em"}}>
					This poll is closed. Loading results...
				</h4>
			</div>
		);
	}
});

var ResultStep = React.createClass({
	render: function() {
		var results = this.props.results.map(function(r, index) {
			var count = "";
			for (var i = 0; i < r.count; ++i) {
				count += "|";
			}
			return (
				<div key={index} className="row">
					<div className="col-xs-6">
						{r.name}
					</div>
					<div className="col-xs-6">
						{count || "0"}
					</div>
				</div>
			);
		});
		return (
			<div>
				{results}
			</div>
		);
	}
});

var PrematurePoll = React.createClass({
	render: function() {
		return (
			<div>
				<h3 style={{marginTop: "3em"}}>
					<i>This poll hasn&apos;t started yet.</i>
				</h3>
				<h3 style={{marginTop: "2em"}}>
					Come back at precisely
				</h3>
				<h3 style={{marginTop: "2em"}}>
					<b>{new Date(this.props.startDate).toString()}</b>
				</h3>
			</div>
		)
	}
});

var OpenPoll = React.createClass({
	render: function() {
		return (
			<div className="row" style={{marginTop: "2em"}}>
				<div className="col-sm-6">
					<Ballot pollId={this.props.pollId} />
				</div>
				<div className="col-sm-6">
					<Candidates initialCandidates={this.props.candidates} />
				</div>
			</div>
		)
	}
});

var Ballot = React.createClass({
	getInitialState: function() {
		return {
			ballot: null
		};
	},

	componentDidMount: function() {
		api.getBallot(this.props.pollId, function(err, ballot) {
			if (err) {
				console.log(err);
				return;
			}
			this.setState({ballot: ballot});
		}.bind(this));
	},
	handleDragOver: (e) => {
		for (var i = 0; i < e.dataTransfer.types.length; i++) {
			if (e.dataTransfer.types[i] === 'from-candidates') {
				e.preventDefault();
			}
		}
	},
	handleDrop: function (e) {
	  var selection = JSON.parse(e.dataTransfer.getData('from-candidates'));
	  var currentBallot = this.state.ballot;

	  currentBallot.candidates.push(selection);
	  this.setState({ballot: currentBallot});

	  this.saveBallot();

	  e.preventDefault();
	},
	saveBallot: function () {
		api.saveBallot(this.state.ballot, function(err, ballot) {
			if (err) {
				console.log(err);
				return;
			}
		});
	},

	removeCandidate: function (candidateId) {
		var ballot = this.state.ballot;
		ballot.candidates = ballot.candidates.filter((c) => c._id !== candidateId);
		this.setState({ballot: ballot});

		this.saveBallot();
	},

	render: function() {
		var selections;
		if (this.state.ballot) {
			selections = this.state.ballot.candidates.map(function(o) {
				return (
					<DraggableCandidate option={o} key={o._id} transferKey='from-ballot' onCandidateMove={this.removeCandidate}/>
				);
			}.bind(this));
		}

		return (
			<div>
				<h3 className="text-center">
					Ballot
				</h3>
				<ol
					onDragOver={this.handleDragOver}
					onDrop={this.handleDrop}
					style={{listStyleType: "none", height: "25em", border: "solid 1px grey", paddingLeft: "0"}}>
					{selections}
				</ol>
			</div>
		);
	}
});

var Candidates = React.createClass({
	getInitialState: function () {
		return {candidates: this.props.initialCandidates};
	},

	handleDragOver: (e) => {
		for (var i = 0; i < e.dataTransfer.types.length; i++) {
			if (e.dataTransfer.types[i] === 'from-ballot') {
				e.preventDefault();
			}
		}
	},

	handleDrop: function (e) {
	  var selection = JSON.parse(e.dataTransfer.getData('from-ballot'));

	  this.setState({candidates: this.state.candidates.concat(selection)});

	  e.preventDefault();
	},

	render: function() {
		var options = this.state.candidates.map(function(o) {
			return (
				<DraggableCandidate option={o} key={o._id} transferKey='from-candidates' onCandidateMove={this.removeCandidate}/>
			);
		}.bind(this));

		return (
			<div>
				<h3 className="text-center">
					Candidates
				</h3>
				<ul
					onDragOver={this.handleDragOver}
					onDrop={this.handleDrop}
					style={{listStyleType: "none", height: "25em", border: "solid 1px grey", paddingLeft: "0"}}>
					{options}
				</ul>
			</div>
		);
	},

	removeCandidate: function (candidateId) {
		var filteredCandidates = this.state.candidates.filter((c) => c._id !== candidateId);
		this.setState({candidates: filteredCandidates});
	}
});

var DraggableCandidate = React.createClass({
	handleDragStart: function (e) {
		e.dataTransfer.setData(this.props.transferKey, e.target.getAttribute('data-option'));
		e.dataTransfer.effectAllowed = 'move';
	},

	handleDragEnd: function (e) {
		if (e.dataTransfer.dropEffect === 'none') {
			return;
		}

		this.props.onCandidateMove(this.props.option._id);
	},

	render: function () {
		return (
			<li
				draggable="true"
				onDragStart={this.handleDragStart}
				onDragEnd={this.handleDragEnd}
				style={{paddingTop: ".5em", paddingBottom: ".5em", borderBottom: "solid 1px lightgrey", paddingLeft: ".5em"}}
				data-option={JSON.stringify(this.props.option)}>
					{this.props.option.name}
			</li>
		);
	}
});

ReactDOM.render(
  <PollingBooth />,
  document.getElementById('content')
);
