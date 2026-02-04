# A [Chataigne](https://github.com/benkuper/Chataigne) Module for interfacing with grandMA2
---

### Pre-Release repository as placeholder for linking and starting documentation.  
#### Expect initial first module release in February.  


---
### ⚠️ Below documentation is currently active work in progress.  ⚠️
---





This module mimics a [Web Remote](https://help.malighting.com/grandMA2/en/help/key_remote_control_web_remote.html) to interface with grandMA2.  

## Features

🐌 Using a FPS filter to limit the maximum rate of any send mappings is highly recommended.  
#### Sending
- Send command (String)
- Send executor fader value (Float)*
- Send executor button state (Bool)
- Change executor Label (String)
- Change page (Integer)
- Sync Chatainge page to MA2
     
*Due to MA2 being able to fully lock up with very high request rates, sending of the fader value has a module sided **DYNAMIC** rate limiter.


#### Receiving
- Executor Label (String)
- Executor Run State (Bool)
- Executor Button Text (String)
- Executor Color (Color)
- Executor Fader Value (Float) (Faders Only)
- Executor Fader Text (String) (Faders Only)
- Executor Fader Value (String) (Faders Only)
  

<details>
  <summary><b>ToDo</b></summary>
  
  ###### Sending
  - Send hardkeys (Function buttons)
  - Change executor color (Appearance)
  - Change executor button functions (GO/FLASH/TEMP/...)
  - Send Encoders
  - Send dimmer wheel
  - Send grandmaster / B.O. (Unsure if feasible other than a CMD Wrapper)

  ###### Receiving
  - Executor cue list
  - Encoder page/parameters
  - Console log
  - Sync MA2 page to Chataigne (A little more complex)
  - B/O State (Unsure if feasible)
  - Grandmaster Fader Value (Unsure if feasible)
</details>


## Preparing grandMA2  

If you have not used the MA2 Web Remote before, you will need to enable it first.

Enable it by setting `Setup > Console > Global Settings > Remotes` to `Login Enabled` 
<img width="520" alt="image" src="https://github.com/user-attachments/assets/d5798959-fbc4-4734-8d3f-a0d23b09200c" />

By default, the module is configured to login with the user `chataigne` and the password `chataigne`.  
Either create this user profile, or use your own or an existing one by changing the modules default login settings.  

To create / manage a user account in MA2, go to `Setup > Console > User & Profiles Setup`.  
<img width="520" alt="image" src="https://github.com/user-attachments/assets/d5903138-d628-4ef3-9e6e-2ec3bc138a89" />  

In this section you can also later monitor / verify that the module is connected correctly.  
<img width="520" alt="image" src="https://github.com/user-attachments/assets/c7c80507-b330-4dea-ab0d-9410dc9984af" />  
This should change from `guest` to your configured user, when the module logs into the session.  


## The Parameters section  

## Basic Settings
<img width="468" height="49" alt="image" src="https://github.com/user-attachments/assets/3f3fbf97-11ab-44f8-a96b-1e613676dfc9" />

- **Server Path:**  
     If running OnPC on the same machine it should work as is, otherwise change IP to the desired target. `<console ip>:80/?ma=1`
- **Connected:**  
     If the IP is valid and the target can be reached, this should light up.  

## Session

This Section is responsible for starting/stopping the connection to grandMA2.  
This will need to be done every time a session timed out (GrandMA2 Restarted, Network interrupted, Chataigne Restarted).  

<img width="466" height="144" alt="image" src="https://github.com/user-attachments/assets/7aef7ca9-565d-4217-94aa-0f37491e257d" />   
   
- **Status:**  
     Indicates the current session state.  
- **Session ID:**  
     This should tick up with every Session Login, untill MA2 has restarted and get's reset.  
     If this ever reads -2, too many active connection requests have been made and the limit has been reached.   (3 Max)  
     This should reset once users leave of sessions time out.
  
- **Start Session:**  
     To join the current GrandMA2 session of the WebRemote.  
- **End Session:**  
     Logout user from Session and terminate connection.  

   
- **Credentials:**  
     If you do not use the MA2 user `chataigne` with the password `chataigne` configure the login details here.  
     <img width="456" height="74" alt="image" src="https://github.com/user-attachments/assets/64c1a1f9-244f-443b-bed6-968d2f8e6dbf" />   

     Please note that the password field needs to be a MD5 hash of the password you set in MA2.  
     You can use any [MD5 hash generator](https://www.md5hashgenerator.com) to generate the hash of the password. (Careful not to include extra spaces!)  

## The Playbacks section

In this Section you configure which executors you want to request from MA2.  
- **Request Playbacks:**  
     Enable to actively request data from MA2, if you only intend to SEND this can be off.  

Then there is the Dynamic and Static config sections.  

In the Dynamic section you configer Faders and Buttons in relativity to the Active Page. 
<img width="456" height="162" alt="image" src="https://github.com/user-attachments/assets/e31fc6bb-538f-45d9-8b6c-a3fd86dca0df" />  

- **Active Page:**  
  Specifies the page you want to request playbacks for.
  This is the value you want to reference / change for any kind of relative actions/mappings.  

- **Sync to MA2:**  
     Enabling this will cause the module to send a page change request when ever you change the Active Page number to keep in sync.
   
- **Faders / Buttons:**  
     The default example config shows how you can request faders x.001 - x.005 and x.006 - x.015 where x represents the page set as *Active Page**  
     While the example `1-5;6-15` works, the simpler way to request x.001 to x.0016 would be to just write `1-16`.  
     By using `;` you rather specifiy blocks that have separation in between each other, for example `1-15;61-75`

     Generally, faders go from 1-90, Buttons go from 101-190.  
     Requesting any outside this range can/will lead to undesired behaviour.  

     If you do not need a specific field, leave it blank. (⚠️Make sure it's blank and not a space. ⚠️)  
     The more / faster you request the higher the processing load will be.  
     Only request what you really need, to not waste resources.   

- **Fader/Button Intervall:**  
     This specifices the time between requests, a longer intervall is less resource heavy.  
     The Default should work well for many cases but can be adjusted in steps of 20ms each.  

     You want to keep this as high as is tollerable for your application, this exponential increases processing load.  





