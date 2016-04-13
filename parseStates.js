/* State Format
{
	name: "Base",
	children: [{<State>}]
}
*/
var statesTree = {
	name: "app"
}

for (var i = 0; i < state.get().length; i++) {
	var stateObj = state.get()[i];
	var stateName = stateObj.name;
	if (stateName === "") {
		continue;
	}
	var splitStateName = stateName.split('.');
	var currentWorkingState = statesTree;

	for (var j = 0; j < splitStateName.length; j++) {
		var levelName = splitStateName[j];
		
		if (currentWorkingState.children === undefined) {
			currentWorkingState.children = [];
		}

		var childStateExists = false;
		for (var k = 0; k < currentWorkingState.children.length; k++) {
			var childState = currentWorkingState.children[k];
			if (childState.name === levelName) {
				// Reassign pointer
				currentWorkingState = childState;
				childStateExists = true;
				break;
			}
		}

		if (!childStateExists) {
			var childState = {
				name: levelName,
				linked: stateObj.linked
			};
			currentWorkingState.children.push(childState);

			// Reassign pointer
			currentWorkingState = childState;
		}
	}
}
//console.log(JSON.stringify(statesTree));
console.log(statesTree['children'].toJSON());