const ctx = new (window.AudioContext || window.webkitAudioContext)()
const fft = new AnalyserNode(ctx, { fftSize: 2048 })


function step( rootFreq, steps ) {
    let ratios = [
        1,      // unison ( 1/1 )       // C
        25/24,  // minor second         // C#
        9/8,    // major second         // D
        6/5,    // minor third          // D#
        5/4,    // major third          // E
        4/3,    // fourth               // F
        45/32,  // diminished fifth     // F#
        3/2,    // fifth                // G
        8/5,    // minor sixth          // G#
        5/3,    // major sixth          // A
        9/5,    // minor seventh        // A#
        15/8,   // major seventh        // B
    ]

    if(steps >= ratios.length){
        let octaveShift = Math.floor( steps / ratios.length )
        rootFreq = rootFreq * Math.pow(2,octaveShift)
    }

    let r = steps % ratios.length
    let freq = rootFreq * ratios[r]
    return Math.round(freq*100)/100
}

function tone (type, pitch, time, duration) {
    const t = time || ctx.currentTime
    const dur = duration || 0.25

    const osc = new OscillatorNode(ctx, {type : type || 'sine', frequency: pitch || 440})
    const lvl = new GainNode(ctx, {gain: 0.25})
    osc.connect(lvl)
    lvl.connect(ctx.destination)
    lvl.connect(fft)
    osc.start(t)
    osc.stop(t + dur)

    return [osc, lvl]
}




// Map frequency to color, scaling the lowest possible frequency to 0
// and the highest possible frequency (which depends on recursive depth) to 255
function freqToCol (freq, max_depth) {

    // jumping an octave on each recursive call, and starting on the highest step
    highest_adjusted = Math.pow(2,4) * 110 * 15/8 - 110
    
    freq_adjusted = freq - 110
    return freq_adjusted / highest_adjusted * 255
}



function generateRecursive(steps_list, scale, base_pitch, cur_step_list, starttime, additionaltime, depth, notelen, osc_list, parent_div, div_size, max_depth) {
    let time = starttime + additionaltime
    if (depth == 1){  
        for (let s = 0; s < steps_list[0].length ; s++){

            let freqs = []
            for (let sl = 0; sl < 3; sl++){
                
                let scale_step = steps_list[sl][s] + cur_step_list[sl]
                let note_step = scale[scale_step % scale.length] + 12 * Math.floor(scale_step / scale.length)
                let freq = step(base_pitch, note_step)
                osc_list[sl].frequency.setValueAtTime(freq, time + s*notelen)

                freqs.push(freq)     
            }


            let new_div = document.createElement('div')
            new_div.style.width = div_size.toString() + "px"
            new_div.style.height = div_size.toString() + "px"
            new_div.style.float = "left"
            
            new_div.style.background = "rgb(" + Math.floor(freqToCol(freqs[0], max_depth)) + 
                                         "," + Math.floor(freqToCol(freqs[1], max_depth))  + 
                                         "," + Math.floor(freqToCol(freqs[2], max_depth))  + ")"
            setTimeout(function(){
                parent_div.appendChild(new_div)
            }, 1000* (additionaltime + s*notelen))
        }

        
    }
    else {
        for (let s = 0; s < steps_list[0].length ; s++){
            let new_cur_steps = []
            for (let sl = 0; sl < 3; sl++){
                let steps = steps_list[sl]
                let cur_step = cur_step_list[sl]
                new_cur_steps.push( steps[s] + cur_step)
            }

            let new_div = document.createElement('div')
            new_div.style.width = div_size.toString() + "px"
            new_div.style.height = div_size.toString() + "px"
            new_div.style.float = "left"
            parent_div.appendChild(new_div)
            
            generateRecursive(steps_list,
                        scale,
                        base_pitch,
                        new_cur_steps,
                        starttime,
                        additionaltime + Math.pow(steps_list[0].length, depth-1) * notelen * s,
                        depth-1, 
                        notelen,
                        osc_list,
                        new_div,
                        div_size / 2,
                        max_depth)
        }
    }
}


document.getElementById('start').addEventListener('click', function() {
    ctx.resume()

    let scales =
    [[ 0, 2, 4, 5, 7, 9, 11 ],
    [0, 2, 3, 5, 7, 8, 10]
    ]

    let scale = scales[Math.floor(Math.random() * scales.length)]
    let start_step = Math.floor(Math.random() * 12)
    let depth = document.getElementById('depth').value || 4

    let tonelen = document.getElementById('speed').value || 0.1
    let starttime = ctx.currentTime
    let startFreq = step(110, start_step)
    
    let melodies = []
    let osc_list = []

    let soundtypes = ['sine', 'square', 'sawtooth']

    for(let j = 0; j < 3; j++){
        let melody = []
        for(let i= 0; i < 4; i++){
            melody.push(Math.floor(Math.random() * 8))
        }
        console.log('melody', melody)
        melodies.push(melody)

        let t = tone(soundtypes[j], startFreq, starttime, Math.pow(4, depth) * tonelen)
        osc_list.push(t[0])
    }

    let new_div = document.createElement('div')
    new_div.style.width = "500px"
    new_div.style.height = "500px"
    document.getElementById('rec').appendChild(new_div)

    setTimeout(function() {
        new_div.remove()
    },Math.pow(4, depth) * tonelen * 1000);

    generateRecursive(melodies, scale, startFreq, [0,0,0], starttime, 0, depth, tonelen, osc_list, new_div, 250, depth)


})
