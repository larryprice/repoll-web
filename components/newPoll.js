var React = require('react'),
	ReactDOM = require('react-dom'),
  DateTimeField = require('react-bootstrap-datetimepicker'),
  api = require('../api'),
  moment = require('moment');

var Candidate = React.createClass({
  delete: function () {
    this.props.deleteCallback();
  },

  render: function () {
    return (
      <li>
        {this.props.name}
        <button
          type='button'
          className='btn btn-link btn-xs'
          onClick={this.delete}>
          x
          </button>
      </li>
    );
  }
});

var NewPoll = React.createClass({
  getInitialState: function () {
    return {
      candidates: [],
			startDate: new Date(),
			endDate: new Date(),
    };
  },

  render: function () {
    var candidateNodes = this.state.candidates.map(function(candidate, index) {
      return (
          <Candidate key={index + 1} name={candidate.name}  deleteCallback={() => this.deleteCandidate(candidate.name)}/>
      );
    }.bind(this));

    return (
      <form className='newPoll' onSubmit={this.handleSubmit}>
        <div className='nameAndPasscode'>
          <h1 className="text-center">OK! Tell us about your new poll.</h1>

          <div className="form-group">
            <label>Name</label>
            <input type='text' className="form-control" onChange={this.handleNameChange}/>
          </div>

          <div className="form-group">
            <label>Passcode</label>
            <input type='password' className="form-control" onChange={this.handlePasscodeChange}/>
          </div>
        </div>

        <div className='candidates'>
          <p>Add options for your voters to rank.</p>
          <div className="well well-sm">
            <ol>
              {candidateNodes}
            </ol>
          </div>

          <div className="form-group">
            <div className="input-group">
              <input
                className='form-control'
                type='text'
                onChange={this.handleCandidateNameChange}
                value={this.state.newCandidateName} />
              <span className='input-group-btn'>
                <button type="button" className="btn btn-default" onClick={this.addCandidate}>Add +</button>
              </span>
            </div>
          </div>
        </div>

        <div className='date'>
          <div className="form-group">
            <label>When does your poll open?</label>
            <DateTimeField
              onChange={this.handleStartDateChange}
              showToday={true} />
          </div>

          <div className="form-group">
            <label>When does your poll close?</label>
            <DateTimeField
              onChange={this.handleEndDateChange}
              showToday={true} />
          </div>
        </div>

        <button type='submit' className="btn btn-default btn-block">Let&apos;s do this 👍</button>
      </form>
    );
  },

  handleNameChange: function (e) {
    this.setState({name: e.target.value});
  },

  handlePasscodeChange: function (e) {
    this.setState({passcode: e.target.value});
  },

  handleCandidateNameChange: function (e) {
    this.setState({newCandidateName: e.target.value});
  },

  addCandidate: function () {
    var candidate = {name: this.state.newCandidateName};
    if (candidate.name && candidate.name.trim().length > 0) {
      this.setState({candidates: this.state.candidates.concat(candidate)});
      this.setState({newCandidateName: ''});
    }
  },

  deleteCandidate: function (candidateName) {
    var filteredCandidates = this.state.candidates.filter((c) => c.name !== candidateName)
    this.setState({candidates: filteredCandidates});
  },

  handleStartDateChange: function (startDate) {
    this.setState({startDate: startDate});
  },

  handleEndDateChange: function (endDate) {
    this.setState({endDate: endDate});
  },

  handleSubmit: function (e) {
    e.preventDefault();

    var data = {
      name: this.state.name,
      passcode: this.state.passcode,
      candidates: this.state.candidates,
      startDate: moment(+this.state.startDate).format(),
      endDate: moment(+this.state.endDate).format()
    }

		api.createPoll({
      name: this.state.name,
      passcode: this.state.passcode,
      candidates: this.state.candidates,
      startDate: moment(+this.state.startDate).format(),
      endDate: moment(+this.state.endDate).format()
    }, function(err, newPoll) {
			if (err) {
				console.log(err);
				return;
			}
			ReactDOM.render(
				<NewPollSuccess name={newPoll.name} passcode={this.state.passcode}/>,
				document.getElementById('content')
			);
		}.bind(this));
  }
});

var NewPollSuccess = React.createClass({
  render: function () {
    return (
      <div className='newPollSuccess'>
        <div className="text-center">
          <h1>You're all set!</h1>
          <p>Have your voters download the app or visit <a href='https://repoll.net'>RePoll.net</a> and enter the info below.</p>
        </div>

        <h4>Name</h4>
        <div className="well">
          <span>{this.props.name}</span>
        </div>

        <h4>Passcode</h4>
        <div className="well">
          <span>{this.props.passcode}</span>
        </div>
      </div>
    );
  }
});

ReactDOM.render(
  <NewPoll />,
  document.getElementById('content')
);
