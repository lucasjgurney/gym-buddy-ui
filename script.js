var apiURL = "http://127.0.0.1:8080/api"
var staticURL = "http://127.0.0.1:8080/static"

var jsonWebToken;
var userId;
var userRFID;

var oRMExercise,
	oRMExerciseName,
	oRMWeight,
	oRMReps;

function changePage(page) {
	$.mobile.changePage(page);
	$("#error").text("");
}



$("body").keydown(function (k){
    if(k.keyCode == 13 && $.mobile.activePage.attr("id") == "authenticate") {
		userRFID = "code";
		
		$.ajax({
			method: "POST",
			url: apiURL + "/authenticate",
			data: {
				rfid: userRFID
			},
			success: function (data) {
				jsonWebToken = data.token;
				userId = data.userId;
				
				$("#menuUser").text(data.userName);
				
				changePage("#mainMenu");
			},
			crossDomain: true,
			dataType: "json",
		});
    }
});

function suggestExercise() {
	$.ajax({
		method: "GET",
		url: apiURL + "/trainer/suggest",
		data: {
			token: jsonWebToken
		},
		success: function (data) {
			if (data.success === false) {
				$("#error").text("You need to set some one rep maxes.");
			} else {
				$("#suggestExercise").text(data.exercise.name);
				$("#suggestExercise").attr("onclick", "viewExercise(\"" + data.exercise._id + "\")");
				
				$("#suggestSets").text(Math.round(data.sets));
				$("#suggestReps").text(Math.round(data.reps));
				$("#suggestLoad").text(Math.round(data.load) + "kg");
			}
			
			changePage("#suggest");
		},
		crossDomain: true,
		dataType: "json",
	});
}

function oRMChoose() {
	$.ajax({
		method: "GET",
		url: apiURL + "/exercises",
		data: {
			token: jsonWebToken
		},
		success: function (data) {
			$("#oRMPicker").html("");
			for (var i = 0; i < data.length; i++) {
				var exercise = data[i];
				$("#oRMPicker").append("<li><button onclick=\"oRMEnterWeight(&quot;" + exercise._id + "&quot;, &quot;" + exercise.name + "&quot;)\"><b>" + exercise.name + "</b> - " + exercise.apparatus + " - " + exercise.muscles.join(", ") + "</button></li>");
			}
			$("#oRMPicker").trigger("create");
			
			changePage("#oRMChoose");
		},
		crossDomain: true,
		dataType: "json",
	});
}

function oRMEnterWeight(exerciseId, exerciseName) {
	oRMExercise = exerciseId;
	oRMExerciseName = exerciseName;
	
	changePage("#oRMEnterWeight");
}

function enterORMWeight(val) {
	if (val !== -1) {
		if ($("#oRMWeight").text() === "0") {
			$("#oRMWeight").text("");
		}
		
		$("#oRMWeight").text($("#oRMWeight").text() + val);
	} else {
		$("#oRMWeight").text($("#oRMWeight").text().slice(0, -1));
		
		if ($("#oRMWeight").text().length < 1) {
			$("#oRMWeight").text("0");
		}
	}
}

function oRMInputWeight() {
	oRMWeight = parseInt($("#oRMWeight").text());
	
	changePage("#oRMEnterReps");
}

function enterORMReps(val) {
	if (val !== -1) {
		if ($("#oRMReps").text() === "0") {
			$("#oRMReps").text("");
		}
		
		$("#oRMReps").text($("#oRMReps").text() + val);
	} else {
		$("#oRMReps").text($("#oRMReps").text().slice(0, -1));
		
		if ($("#oRMReps").text().length < 1) {
			$("#oRMReps").text("0");
		}
	}
}

function oRMInputReps() {
	oRMReps = parseInt($("#oRMReps").text());
	
	$.ajax({
		method: "POST",
		url: apiURL + "/trainer/max",
		data: {
			token: jsonWebToken,
			weight: oRMWeight,
			reps: oRMReps
		},
		success: function (data) {
			$.ajax({
				method: "PUT",
				url: apiURL + "/users/" + userId + "/maxes",
				data: {
					token: jsonWebToken,
					exercise: oRMExercise,
					oneRepMax: data.oneRepMax
				},
				success: function (data2) {
					$("#oRMResultExercise").text(oRMExerciseName);
					$("#oRMResultValue").text(Math.round(data.oneRepMax));
					
					changePage("#oRMResult");
					
					$.ajax({
						method: "POST",
						url: apiURL + "/authenticate",
						data: {
							rfid: userRFID
						},
						success: function (data) {
							jsonWebToken = data.token;
						},
						crossDomain: true,
						dataType: "json",
					});
				},
				crossDomain: true,
				dataType: "json",
			});
		},
		crossDomain: true,
		dataType: "json",
	});
}

function viewAllExercises() {
	$.ajax({
		method: "GET",
		url: apiURL + "/exercises",
		data: {
			token: jsonWebToken
		},
		success: function (data) {
			$("#exercisesList").html("");
			for (var i = 0; i < data.length; i++) {
				var exercise = data[i];
				$("#exercisesList").append("<li><button onclick=\"viewExercise(&quot;" + exercise._id + "&quot;)\"><b>" + exercise.name + "</b> - " + exercise.apparatus + " - " + exercise.muscles.join(", ") + "</button></li>");
			}
			$("#exercisesList").trigger("create");
			
			changePage("#exercises");
		},
		crossDomain: true,
		dataType: "json",
	});
}

function viewExercise(id) {
	$.ajax({
		method: "GET",
		url: apiURL + "/exercises/" + id,
		data: {
			token: jsonWebToken
		},
		success: function (data) {
			$("#exerciseName").text("Exercise name");
			$("#exerciseApparatus").text("Apparatus used");
			$("#exerciseMuscles").text("Muscles used");
			$("#exerciseTutorial").attr("src", staticURL + "/pilaestra_256x256.png");
			$("#exerciseSteps").html("");
			
			
			$("#exerciseName").text(data.name);
			$("#exerciseApparatus").text(data.apparatus);
			$("#exerciseMuscles").text(data.muscles.join(", "));
			
			$("#exerciseTutorial").attr("src", staticURL + "/exerciseTutorials/" + data._id + ".gif");
			$("#exerciseTutorial").error(function(e) {
				$("#exerciseTutorial").attr("src", staticURL + "/pilaestra_256x256.png");
			});
			
			var steps = data.steps;
			for (var i = 0; i < steps.length; i++) {
				$("#exerciseSteps").append("<li class=\"exerciseStep\">" + steps[i] + "</li>");
			}
			
			changePage("#viewExercise");
		},
		crossDomain: true,
		dataType: "json",
	});
}

function logOut(clicked) {
	if (clicked) {
		$("#logOut").text("Goodbye!")
	}
	
	$("#logOut").attr("onclick", "");
	
	this.setTimeout(function () {
		jsonWebToken = undefined;
		changePage("#authenticate");
		$("#logOut").text("Log out")
		$("#logOut").attr("onclick", "logOut(true)")
	}, 2000);
}
