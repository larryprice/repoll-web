module.exports = (function() {
  var baseURL = 'https://api.repoll.net';

  var getSession = function(callback) {
    if (localStorage.getItem('sessionId')) {
      callback(null, localStorage.getItem('sessionId'));
      return;
    }
    var sessionRequest = new XMLHttpRequest();
    sessionRequest.open('PUT', baseURL + '/sessions');
    sessionRequest.onload = function() {
      if (sessionRequest.status >= 200 && sessionRequest.status < 400) {
        var session = JSON.parse(sessionRequest.responseText);
        localStorage.setItem('sessionId', session._id);
        callback(null, session._id);
      } else {
        callback(sessionRequest.responseText);
      }
    };

    sessionRequest.send();
  };

  var getPolls = function(callback) {
    getSession(function(err, sessionId) {
      if (err) {
        callback(err);
        return;
      }

      var pollsRequest = new XMLHttpRequest();
      pollsRequest.open('GET', baseURL + '/polls');

      pollsRequest.setRequestHeader(
        'Authorization',
        'Basic ' + btoa(sessionId + ':')
      );

      pollsRequest.onload = function() {
        if (pollsRequest.status >= 200 && pollsRequest.status < 400) {
          callback(null, JSON.parse(pollsRequest.responseText));
        } else {
          callback(pollsRequest.responseText);
        }
      };

      pollsRequest.onerror = function() {
        callback(pollsRequest.responseText);
      };

      pollsRequest.send();
    });
  };

  var getTokenForPoll = function(pollId) {
    var tokens = localStorage.getItem('tokens');
    tokens = tokens ? JSON.parse(tokens) : {};
    return tokens[pollId];
  };
  var setTokenForPoll = function(pollId, tokenId) {
    var tokens = localStorage.getItem('tokens');
    tokens = tokens ? JSON.parse(tokens) : {};
    tokens[pollId] = tokenId;
    localStorage.setItem('tokens', JSON.stringify(tokens));
  };

  var getToken = function(pollId, passcode, callback) {
    var token = getTokenForPoll(pollId);
    if (token) {
      callback(null, token);
      return;
    } else if (!passcode || !pollId) {
      callback("ERROR: POLL ID AND PASSCODE REQUIRED.")
      return;
    }

    getSession(function(err, sessionId) {
      if (err) {
        callback(err);
        return;
      }
      var req = new XMLHttpRequest();
      req.open('PUT', baseURL + '/sessions/' + sessionId + '/token');
      req.setRequestHeader(
        'Authorization',
        'Basic ' + btoa(pollId + ':' + passcode)
      );

      req.onload = function() {
        if (req.status >= 200 && req.status < 400) {
          var t = JSON.parse(req.responseText);
          setTokenForPoll(pollId, t._id);
          callback(null, t._id);
        } else {
          callback(req.responseText);
        }
      };

      req.send();
    });
  };

  var getPoll = function(pollId, callback) {
    getToken(pollId, null, function(err, tokenId) {
      if (err) {
        callback(err);
        return;
      }

      var req = new XMLHttpRequest();
      req.open('GET', baseURL + '/polls/' + pollId);
      req.setRequestHeader(
        'Authorization',
        'Token ' + tokenId
      );

      var that = this;
      req.onload = function() {
        if (req.status >= 200 && req.status < 400) {
          callback(null, JSON.parse(req.responseText));
        } else {
          callback(req.responseText);
        }
      };

      req.send();
    });
  };

  var getPollResults = function(pollId, callback) {
    getToken(pollId, null, function(err, tokenId) {
      if (err) {
        callback(err);
        return;
      }

      var req = new XMLHttpRequest();
      req.open('GET', baseURL + '/polls/' + pollId + '/results');
      req.setRequestHeader(
        'Authorization',
        'Token ' + tokenId
      );

      req.onload = function() {
        if (req.status >= 200 && req.status < 400) {
          callback(null, JSON.parse(req.responseText));
        } else {
          callback(req.responseText);
        }
      };

      req.send();
    });
  };

	var getBallotForPoll = function(pollId) {
		var ballots = localStorage.getItem('ballots');
		ballots = ballots ? JSON.parse(ballots) : {};
		return ballots[pollId];
	};
	var setBallotForPoll = function(pollId, ballotId) {
		var ballots = localStorage.getItem('ballots');
		ballots = ballots ? JSON.parse(ballots) : {};
		ballots[pollId] = ballotId;
		localStorage.setItem('ballots', JSON.stringify(ballots));
	};

	var fetchBallot = function(pollId, callback) {
    getToken(pollId, null, function(err, tokenId) {
			if (err) {
				callback(err);
				return;
			}
			var ballotRequest = new XMLHttpRequest();
			ballotRequest.open('GET', baseURL + '/ballots/' + getBallotForPoll(pollId));
			ballotRequest.setRequestHeader(
				'Authorization',
				'Token ' + tokenId
			);
			ballotRequest.onload = function () {
				if (ballotRequest.status >= 200 && ballotRequest.status < 400) {
					callback(null, JSON.parse(ballotRequest.responseText));
				} else {
					callback(ballotRequest.responseText);
				}
			};
			ballotRequest.send();
		});
	};

	var createBallot = function(pollId, callback) {
    getToken(pollId, null, function(err, tokenId) {
			if (err) {
				callback(err);
				return;
			}
			var req = new XMLHttpRequest();
			req.open('PUT', baseURL + '/ballots');
			req.setRequestHeader(
				'Authorization',
				'Token ' + tokenId
			);
			req.onload = function () {
				if (req.status >= 200 && req.status < 400) {
					var ballot = JSON.parse(req.responseText);
					setBallotForPoll(pollId, ballot._id);
					callback(null, ballot);
				} else {
					callback(req.responseText);
				}
			};
			req.send();
		});
	};

	var getBallot = function(pollId, callback) {
		if (getBallotForPoll(pollId)) {
			fetchBallot(pollId, callback);
		} else {
			createBallot(pollId, callback);
		}
	};

	var saveBallot = function(ballot, callback) {
		getToken(ballot.pollId, "", function(err, tokenId) {
			if (err) {
				callback(err);
				return;
			}
			var req = new XMLHttpRequest();
			req.open('POST', baseURL + '/ballots/' + ballot._id);
			req.setRequestHeader('Content-Type', 'application/json');
			req.setRequestHeader(
				'Authorization',
				'Token ' + tokenId
			);
			req.onload = function () {
				if (req.status >= 200 && req.status < 400) {
					callback(null, JSON.parse(req.responseText));
				} else {
					callback(req.responseText);
				}
			};
			req.send(JSON.stringify({candidates: ballot.candidates}));
		});
	};

	var createPoll = function(poll, callback) {
		getSession(function(err, sessionId) {
			if (err) {
				callback(err);
				return;
			}

			var request = new XMLHttpRequest();
			request.open('PUT', baseURL + '/polls');
			request.setRequestHeader('Content-Type', 'application/json');
			request.setRequestHeader('Authorization', 'Basic ' + btoa(sessionId + ':'));
			request.onload = function () {
				if (request.status >= 200 && request.status < 400) {
					callback(null, JSON.parse(request.responseText));
				} else {
					callback(request.responseText);
				}
			}.bind(this);
			request.onerror = function () {
				callback(request.responseText);
			}
			request.send(JSON.stringify(poll));
		});
	};

  return {
		createPoll: createPoll,
    getPolls: getPolls,
    getPoll: getPoll,
    getPollResults: getPollResults,
		getBallot: getBallot,
		saveBallot: saveBallot
  }
}());
