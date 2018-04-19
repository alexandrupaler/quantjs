/*
 * Methods for availability and consumption of A states
 */
var availableDistilledAStates = 0;
var reachedTimeStep = -1;

var aStatesData = {};

function updateAvailableDistilledStates(timeStep)
{
    if(reachedTimeStep >= timeStep)
        return;

    // //buffer limit
    // if(availableDistilledAStates >= 2)
    //     return;

    //console.log("u A " + timeStep + " " + availableDistilledAStates);
    if( ((timeStep + 1) % toolParameters.distillationLength) == 0)
        availableDistilledAStates++;
    //console.log("to " + availableDistilledAStates);

    reachedTimeStep = timeStep;

    //nu sunt sigur ca trebuie aici
    appendChartData(timeStep);
}

function consumeDistilledState()
{
    availableDistilledAStates--;
}

function checkAvailableDistilledState()
{
    return availableDistilledAStates > 0;
}

function resetAvailableDistilledState()
{
    availableDistilledAStates = 0;
    reachedTimeStep = -1;

    resetChartData();
}

function resetChartData()
{
    aStatesData["steps"] = [];
    aStatesData["nra"] = [];
}

function appendChartData(timeStep)
{
    aStatesData["steps"].push(timeStep);
    aStatesData["nra"].push(availableDistilledAStates);
}