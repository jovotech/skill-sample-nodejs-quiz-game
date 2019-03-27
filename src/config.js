// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    logging: true,
 
    intentMap: {
       'AMAZON.StopIntent': 'END',
       'AMAZON.PauseIntent': 'END',
       'AMAZON.CancelIntent': 'END',
       'AMAZON.RepeatIntent': 'RepeatIntent',
       'AMAZON.HelpIntent': 'HelpIntent',
       'AMAZON.StartOverIntent': 'StartOverIntent',
    },
 
    db: {
         FileDb: {
             pathToFile: '../db/db.json',
         }
     },
 };
 