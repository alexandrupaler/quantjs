/*
 * Methods for availability and consumption of A states
 */
var availableDistilledAStates = 0;
var reachedTimeStep = -1;

var aStatesData = {};

var maximumAToGenerate = -1;
var maximumAAvailable = -1;
var currentlyAGenerated = 0;

/**
 * Returns if distillation should stop
 * @param timeStep
 */
function updateAvailableDistilledStates(timeStep)
{
    if(reachedTimeStep >= timeStep)
        return false;

    /*
        this is for a maximum number of distilled states coming out of the distillery
     */
    if(currentlyAGenerated == maximumAToGenerate)
        return false;//it is already stopped

    /*
        this is for a maximum number of distilled states being available
     */
    if(availableDistilledAStates == maximumAAvailable)
        return false;//it is already stopped

    //console.log("u A " + timeStep + " " + availableDistilledAStates);
    if( ((timeStep + 1) % toolParameters.distillationLength) == 0)
    {
        availableDistilledAStates++;
        currentlyAGenerated++;

        if(availableDistilledAStates == maximumAAvailable)
            return true;

        if(currentlyAGenerated == maximumAToGenerate)
            return true;
    }
    //console.log("to " + availableDistilledAStates);

    reachedTimeStep = timeStep;

    //nu sunt sigur ca trebuie aici
    appendChartData(timeStep);
}

/**
    Returns if distillation is allowed to proceed
 */
function consumeDistilledState()
{
    availableDistilledAStates--;

    if(availableDistilledAStates + 1 == maximumAAvailable)
        return true;

    return false;//already allowed to proceed
}

function checkAvailableDistilledState()
{
    return availableDistilledAStates > 0;
}

function resetAvailableDistilledState()
{
    maximumAAvailable = 2;
    availableDistilledAStates = 0;

    reachedTimeStep = -1;

    maximumAToGenerate = -1;
    currentlyAGenerated = 0;

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