function binary(nr, nrLogQubits)
{
    return Number(nr).toString(2).padStart(nrLogQubits, '0');
}

function allRightToLeftWithValue(val, nr)
{
    var ret = new Array();

    var oppositeVal = 1 - Number(val);
    var limit = firstRightToLeftWithValue(oppositeVal, nr);
    if(limit == -1)
    {
        limit = 0;
        //will actually add all to ret
    }

    for(var i=nr.length - 1; i >= limit; i--)
    {
        if(nr[i] == val)
        {
            ret.push(i);
        }
    }

    return ret;
}

function firstRightToLeftWithValue(val, nr)
{
    for(var i = nr.length - 1; i >=0; i--)
    {
        if(nr[i] == val)
        {
            return i;
        }
    }
    return -1; //not found
}