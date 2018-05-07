const DistillationResult = {
    WORKING : "working",
    DISTILLED : "distilled",
    STOPNOW : "stopnow",
    STOPPED : "stopped",
    STARTNOW : "startnow",
    DONTCARE : "dontcare"//does not affect the gate list or the display of the distillation activity
}

/*
 * Methods for availability and consumption of A states
 */
var availableDistilledAStates = 0;
var reachedTimeStep = -1;
var aStatesData = {};
var currentlyAGenerated = 0;
var maxNrAToGenerate = -1;
var lastDistillEndTime = -1;

//the current state of the distillery is stored
var currentState = DistillationResult.WORKING;

function isDistillationTime(timeStep)
{
    var ret = ((timeStep - lastDistillEndTime) % toolParameters.distillationLength) == 0;

    return ret;
}

/**
 * Returns true if distillation should stop
 * @param timeStep
 */
function updateAvailableDistilledStates(timeStep)
{
    if(reachedTimeStep == timeStep)
    {
        //the currentState can be changed potentially only by consume
        return currentState;
    }
    //was <=
    else if(timeStep < reachedTimeStep)
    {
        //cannot go back in time
        return DistillationResult.DONTCARE;
    }
    else if(timeStep > reachedTimeStep)
    {
        //store the current state with append
        if(reachedTimeStep != -1)
            appendChartData(reachedTimeStep, currentState, false);

        currentState = DistillationResult.WORKING;
        if(evaluateCloseDistillery())
        {
            //distillery is closed forever
            currentState = DistillationResult.STOPPED;

            console.log("THIS IS STOPPED!");
        }
        else
        {
            if (!evaluateStopCondition())
            {
                if (isDistillationTime(timeStep)) {
                    availableDistilledAStates++;
                    currentlyAGenerated++;
                    currentState = DistillationResult.DISTILLED;
                }
            }

            if(evaluateStopCondition()) {
                if (currentState == DistillationResult.DISTILLED)
                    currentState = DistillationResult.STOPNOW;
                else
                    currentState = DistillationResult.STOPPED;
            }
        }

        reachedTimeStep = timeStep;
    }

    return currentState;
}

/**
 * Returns true if the stop condition is fulfilled. False, otherwise.
 */
function evaluateStopCondition()
{
    return (availableDistilledAStates == toolParameters.maximumAAvailable);
}

/**
 * Returns true if all the necessary T states were distilled, and the distillery
 * is not required for the rest of the circuit. False, otherwise.
 */
function evaluateCloseDistillery()
{
    return currentlyAGenerated == maxNrAToGenerate;
}

/**
    Returns true if distillation is allowed to proceed
 */
function consumeDistilledState(timeStep)
{
    var ret = DistillationResult.DONTCARE;

    if(currentState == DistillationResult.STOPPED || currentState == DistillationResult.STOPNOW)
    {
        if(!evaluateCloseDistillery()) {
            //once all the distillations were performed
            //it is useless to start the distillery again
            ret = DistillationResult.STARTNOW;
            lastDistillEndTime = timeStep;
        }


        if(!evaluateCloseDistillery())
        {
            if (currentState == DistillationResult.STOPPED) {
                //can start one step before?
                lastDistillEndTime--;
                currentState = DistillationResult.WORKING;
            }

            if (currentState == DistillationResult.STOPNOW) {
                currentState = DistillationResult.DISTILLED;
            }
        }
    }

    availableDistilledAStates--;

    return ret;//already allowed to proceed
}

function checkAvailableDistilledState()
{
    return availableDistilledAStates > 0;
}

function resetAvailableDistilledState()
{
    availableDistilledAStates = 0;

    reachedTimeStep = -1;

    currentlyAGenerated = 0;
    maxNrAToGenerate = -1;

    lastDistillEndTime = -1;

    currentState = DistillationResult.WORKING;

    resetChartData();
}

function resetChartData()
{
    aStatesData.steps = [];
    aStatesData.nra = [];
    aStatesData.separators = [];
}

function appendChartData(timeStep, activityState, allowOverwrite)
{
    var existingIndex = aStatesData.steps.indexOf(timeStep);

    //???
    var writeState = activityState;
    if(activityState == DistillationResult.STOPNOW)
        writeState = DistillationResult.DISTILLED;

    if(existingIndex == -1)
    {
        aStatesData.steps.push(timeStep);
        aStatesData.nra.push(availableDistilledAStates);
        aStatesData.separators.push(writeState);
    }

    if(existingIndex != -1 && allowOverwrite)
    {
        aStatesData.steps[existingIndex] = timeStep;
        aStatesData.nra[existingIndex] = availableDistilledAStates;
        aStatesData.separators[existingIndex] = writeState;
    }
}