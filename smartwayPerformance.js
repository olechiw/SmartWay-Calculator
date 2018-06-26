// File for all of the performance rankings and their corresponding pollution coeffecients

class Type
{
    constructor (rankGroupTonMi, rankGroupMi)
    {
        // For units of TonMile
        this.tonMi = rankGroupTonMi
        // For units of just Mile
        this.Mi = rankGroupMi
    }
}

class RankGroup
{
    constructor (r1, r2, r3, r4, r5, ns)
    {
        this.rank1 = r1
        this.rank2 = r2
        this.rank3 = r3
        this.rank4 = r4
        this.rank5 = r5
        this.NS = ns
    }
}

class PollutionCoeffecient
{
    constructor (C, N, P)
    {
        // Pollution per Tonn Mile
        this.CO2 = C
        this.NOx = N
        this.PM = P
    }
}


//TODO: WRITE A JSON AND PARSE IT FOR THE DIFFERENT CONSTANTS