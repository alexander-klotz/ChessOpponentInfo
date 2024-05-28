
let headers = new Headers( {'User-Agent':'username: alex248player(AddonTesting), email: galaxylifezocker@gmail.com'});
let textcolor = 'green' 
let playerStats = undefined

chrome.runtime.onMessage.addListener(function (request) {
    const { type, value } = request;
    
    if (type === "NEW") {
        newGameStarted();
      }
    });

const newGameStarted = async () => {

    // reset the playerStats
    let playerStats = undefined

    const optionsData = await chrome.storage.sync.get("options");
    const options = optionsData.options
    removeElementsByClass("totalGames")
    removeElementsByClass("winrate")
    removeElementsByClass("AccAge")

    const usernameElements = document.getElementsByClassName("user-username-component user-username-white user-username-link user-tagline-username");
    const usernameElement = usernameElements[0];
    const opponentUsername = usernameElement.innerText
    textcolor = window.getComputedStyle(usernameElement).color;
    

    if (options.tgc){
        await addTotalGamesPlayed(opponentUsername);
    }
    if (options.aa){
        setTimeout(async () => {
            await addAccAge(opponentUsername);
        }, 100); // Delay of 0.1 second
    }
    if (options.aw){
        setTimeout(async () => {
            await addNGamesWinrate(options.avgN, opponentUsername);
        }, 200); // Delay of 0.2 second
    }
}

function removeElementsByClass(className){
    const elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}


const addTotalGamesPlayed = async (opponentUsername) => {
    const totalGamesExists = document.getElementsByClassName("totalGames")[0];

    if (totalGamesExists) {
        totalGamesExists.innerText = '...'
    }
    var calculatedTotalGames = await combinedGamesCount(opponentUsername);

    if (totalGamesExists) {
        totalGamesExists.innerText = '' + calculatedTotalGames;
    } else {
        const totalGames = document.createElement("SPAN");

        totalGames.className = "chess-info " + "totalGames";
        totalGames.title = "Total games played";
        totalGames.style.color = textcolor;

        var text = document.createTextNode('' + calculatedTotalGames);
        totalGames.appendChild(text);

        const userTagLine = document.getElementsByClassName("user-tagline-component")[0];
        if (userTagLine) {
            userTagLine.append(totalGames);
        } else {
            console.error('userTagLine element not found');
        }
    }
}

const addNGamesWinrate = async (n, opponentUsername) => {
    const winrateExists = document.getElementsByClassName("winrate")[0];

    if (winrateExists) {
        winrateExists.innerText = '...'
    }

    var calculatedWinrate = await lastNGamesWinrate(opponentUsername, n);

    if (winrateExists) {
        winrateExists.innerText = '' + calculatedWinrate;
    } else {
        const winrateSpan = document.createElement("SPAN");

        winrateSpan.className = "chess-info " + "winrate";
        winrateSpan.title = `winrate over the last ${n} games`;
        winrateSpan.style.color = textcolor;       // TODO: depending on the winrate change the colour maybe

        var text = document.createTextNode('' + calculatedWinrate);
        winrateSpan.appendChild(text);

        const userTagLine = document.getElementsByClassName("user-tagline-component")[0];
        if (userTagLine) {
            userTagLine.append(winrateSpan);
        } else {
            console.error('userTagLine element not found');
        }
    }
}


const addAccAge = async (opponentUsername) => {
    const AccAgeExists = document.getElementsByClassName("AccAge")[0];

    if (AccAgeExists) {
        AccAgeExists.innerText = '...'
    }

    var accAge = await getAccAge(opponentUsername);

    if (AccAgeExists) {
        AccAgeExists.innerText = '' + accAge;
    } else {
        const AccAgeSpan = document.createElement("SPAN");

        AccAgeSpan.className = "chess-info " + "AccAge";
        AccAgeSpan.title = `Account age`;
        AccAgeSpan.style.color = textcolor;

        var text = document.createTextNode('' + accAge);
        AccAgeSpan.appendChild(text);

        const userTagLine = document.getElementsByClassName("user-tagline-component")[0];
        if (userTagLine) {
            userTagLine.append(AccAgeSpan);
        } else {
            console.error('userTagLine element not found');
        }
    }
}


/**------------------- TOTAL GAMES FUNCTIONALITY -------------------**/

/**
 * This returns a object which contains the amount of games of the operand username (string) and undefined if an error occurs.
 * @function
 * @param {string} username
 * @returns {object} the total games played by <username> as an object with the different time controls e.g. 'bullet'
 */
async function totalGamesObj(username){
    const apiUrl = `https://api.chess.com/pub/player/${username}/stats`;

    try {
        const response = await fetch(apiUrl, {headers: headers});
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Data not found');
            } else if (response.status === 500) {
                throw new Error('Server error');
            } else {
                throw new Error('Network response was not ok');
            }
        }
        playerStats = await response.json();
        const collectedGames = {}

        const gameTypes = ['chess_daily', 'chess_rapid', 'chess_blitz', 'chess_bullet'] 
        for(let gameType of gameTypes){
            if(Object.hasOwn(playerStats, gameType)){
                collectedGames[gameType.slice(6)] = playerStats[gameType].record.win + playerStats[gameType].record.draw + playerStats[gameType].record.loss
            }else{
                collectedGames[gameType.slice(6)] = 0
            }
        }
        return collectedGames;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

/**
 * This returns a object which contains the amount of games of the operand username (string) and undefined if an error occurs.
 * @function
 * @param {string} username
 * @returns {string} the total games played by <username> summed up and in human readable format
 */
async function combinedGamesCount(username) {
    try {
        const collectedGames = await totalGamesObj(username);
        if (collectedGames) {
            let total = Object.values(collectedGames).reduce((a, b) => a + b, 0);
            return readablizeNumber(total);
        } else {
            throw new Error('Failed to retrieve games count');
        }
    } catch (error) {
        console.error('Error:', error);
        return 'N/A';
    }
}


function readablizeNumber(number) {
    var s = ['', 'k', 'M', 'B', 'T'];
    var e = Math.floor(Math.log(number) / Math.log(1000));
    return (number / Math.pow(1000, e)).toFixed(0) + s[e];
}


/**------------------- LAST 'N' GAMES PERFORMANCE -------------------**/

/**
 * This returns the winrate/performance of the last 'n' games. It only looks back one year, so there might not be enough games.
 * @function
 * @param {string} username
 * @returns {string} the winrate of the last 'n' games of <username> e.g. n = 20, draws = 5, wins=10, loss=5 we get '12.5/20'
 */
async function lastNGamesWinrate(username, n){
    const apiUrl = `https://api.chess.com/pub/player/${username}/games/`;
    const collectedGames = []

    const currentDate = new Date();
    const currentMonth = currentDate.getUTCMonth() + 1;
    const currentYear = currentDate.getUTCFullYear();
    
    for(let i = 1; i <= 12; i++){
        if(collectedGames.length == n){
            break;
        }
        const previousMonth = (currentMonth - i + 12) % 12 + 1;
        const previousYear = currentYear + Math.floor((currentMonth - i) / 12);
        const formattedPreviousDate = `${previousYear}/${previousMonth.toString().padStart(2, '0')}`;
        
        let attempts = 0;
        while(attempts < 5) {
            try {
                console.log(formattedPreviousDate)
                const response = await fetch(apiUrl.concat(formattedPreviousDate), {headers: headers});
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Data not found');
                    } else if (response.status === 500) {
                        throw new Error('Server error');
                    } else {
                        throw new Error('Network response was not ok');
                    }
                }
                const monthlyGames = await response.json();
                for(let i = monthlyGames.games.length - 1; i >= 0; i--){
                    collectedGames.push(monthlyGames.games[i])
                    if(collectedGames.length == n){
                        break;
                    }
                }
                break; // If fetch is successful, break the loop
            } catch (error) {
                if(error.name === 'TypeError' && error.message === 'Failed to fetch') {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 50)); // Wait for 0.2 seconds before retrying
                } else {
                    console.error('Error:', error);
                    return "N/A";
                }
            }
        }
    }
    return calcWinrate(collectedGames, username);
}


function calcWinrate(collectedGames, username){
    const codeToValueMap = new Map();
    codeToValueMap.set('win', 1);
    codeToValueMap.set('checkmated', 0);
    codeToValueMap.set('agreed', 0.5);
    codeToValueMap.set('repetition', 0.5);
    codeToValueMap.set('timeout', 0);
    codeToValueMap.set('resigned', 0);
    codeToValueMap.set('stalemate', 0.5);
    codeToValueMap.set('lose', 0);
    codeToValueMap.set('insufficient', 0.5);
    codeToValueMap.set('50move', 0.5);
    codeToValueMap.set('abandoned', 0);
    codeToValueMap.set('kingofthehill', 0);
    codeToValueMap.set('threecheck', 0);
    codeToValueMap.set('timevsinsufficient', 0.5);
    codeToValueMap.set('bughousepartnerlose', 0);

    let score = 0
    let totalGames = collectedGames.length

    
    for(let game of collectedGames){
        if(game.black["username"] === username){
            score += codeToValueMap.get(game.black.result)
        }else{
            score += codeToValueMap.get(game.white.result)
        }
    }

    return `${score}/${totalGames}`

}


/**------------------- TIME SINCE CREATION -------------------**/

/**
 * This returns the time since creation of the account and makes it human readable. e.g. m = months, d = days...
 * @function
 * @param {string} username
 * @returns {string} the days/months/years since the creation of <username>
 */
async function getAccAge(username){
    const apiUrl = `https://api.chess.com/pub/player/${username}`;
    let secondsDiff = 0;

    try {
        const response = await fetch(apiUrl, {headers: headers});
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Data not found');
            } else if (response.status === 500) {
                throw new Error('Server error');
            } else {
                throw new Error('Network response was not ok');
            }
        }
        const userData = await response.json();
        const currentUnixTimeStamp = Math.ceil(new Date().getTime() / 1000)
        secondsDiff = currentUnixTimeStamp - userData.joined

    } catch (error) {
        console.error('Error:', error);
        return "N/A";
    }
    
    return readablizeTime(secondsDiff);

}

function readablizeTime(secondsDiff){
    //TODO: maybe change the cutoffs such that we avoid triple numbers instead of such an early cutoff. e.g. 32 days should not be converte to months
    const times = [[60, "mi"], [60*60, "h"], [60*60*24, "d"], [60*60*24*30, "mo"], [60*60*24*365, "y"]]
    for(let timeCutoff of times.reverse()){
        if (secondsDiff > timeCutoff[0]){
            return `${(secondsDiff/timeCutoff[0]).toFixed(1)}${timeCutoff[1]}`
        }
    }
    
    return `${secondsDiff}s`
}



/**------------------- AVERAGE RATING FUNCTIONALITY -------------------**/

/**
 * This returns the average rating of the operand username (string) and undefined if an error occurs with the option to leave out some gameTypes.
 * @function
 * @param {string} username
 * @param {Boolean} includeDaily
 * @param {Boolean} includeRapid
 * @param {Boolean} includeBlitz
 * @param {Boolean} includeBullet
 * @returns {Number} the average rating of <username> of all the specified rating types
 */
async function averageRating(username, includeDaily, includeRapid, includeBlitz, includeBullet){
    const apiUrl = `https://api.chess.com/pub/player/${username}/stats`;
    const includeTimeControl = [includeDaily, includeRapid, includeBlitz, includeBullet]

    // playerStats already loaded
    if(!playerStats){
        try {
            const response = await fetch(apiUrl, {headers: headers});
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Data not found');
                } else if (response.status === 500) {
                    throw new Error('Server error');
                } else {
                    throw new Error('Network response was not ok');
                }
            }
            playerStats = await response.json();
        } catch (error) {
            console.error('Error:', error);
            return "";
        } 
    }

    let totalRating = 0
    let timeControlCount = 0
    const gameTypes = ['chess_daily', 'chess_rapid', 'chess_blitz', 'chess_bullet']
    for(let i = 0; i < gameTypes.length; i++){
        if(includeTimeControl[i] && Object.hasOwn(playerStats, gameTypes[i])){
            totalRating += playerStats[gameTypes[i]].last.rating
            timeControlCount++
        }
    }
    
    return '' + Math.round(totalRating/timeControlCount);
}

