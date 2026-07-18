# A [Chataigne](https://github.com/benkuper/Chataigne) Module for interfacing with grandMA2 and dot2 
Utilises the Web Remote APIs to communicate with the console/onPC software  
 - [grandMA2 Web Remote documentation](https://help.malighting.com/grandMA2/en/help/key_remote_control_web_remote.html)
 - [dot2 Web Remote documentation](https://help.malighting.com/dot2/en/help/key_ht_use_web_remote.html)

## Features

🐌 Using a FPS filter to limit the maximum rate of any send mappings is highly recommended.  
#### Sending
- Send command
- Send hardkeys [^1]
- Send Encoder by Wheel [^2]
- Send Encoder by Attribute
- Set RGB Programmer Attributes by color
- Send executor fader value [^3]
- Send executor button state
- Change executor Label
- Change executor Color
- Change page
- Sync the module's **Active Page** to MA2/dot2

[^1]: These features require the Web Remote user to have ADMIN rights set in MA, as this uses a LUA wrapper and will error with insuficient rights.  

[^2]: Sending Encoder by Wheel is currently implemented trough a CMD wrapper which will spam the commandline for each step.  
This is planned to change to a more sophisticated method which however is a little more complex and time consuming to implement.  

[^3]: Due to MA2 being able to fully lock up with very high request rates, sending of the fader value has a module sided **DYNAMIC** rate limiter.  

#### Receiving
- Executor width (Int)
- Executor active state (Bool)
- Executor selection state (Bool)
- Executor ID / Type / Sequence / Label (String)
- Executor ID / Type / Sequence / Label Color (Color)
- Executor Color (Color)
- Executor Cue Background Color (Color)
- Previous / Current / Next cue (String)
- Prvious / Current / Next Progress (Float)
- Prvious / Current / Next Progress Bar Color (Color)
- Executor Button Text (String)
- Executor Button Text Color (Color)
- Executor Fader Value (Float) (Faders Only)
- Executor Fader Text / Fader Value Text / Upper Button Text / Lower button Text (String) (Faders Only)
- Executor Fader Text Color / Upper Button Text Color / Lower button Text Color (Color) (Faders Only)
  

<details>
  <summary><b>ToDo</b></summary>
  
  ###### Sending
  - Change executor button functions (GO/FLASH/TEMP/...)
  - Send grandmaster (Unsure if feasible other than a CMD Wrapper)
  - Set/Change preset data (Especially color!)

  ###### Receiving
  - Encoder page/attributes/parameters
  - Console log
  - Sync MA2 page to Chataigne (A little more complex)
  - B/O State (Unsure if feasible)
  - Grandmaster Fader Value (Unsure if feasible)
  - Read preset data (Unsure how much will be possible)
</details>

# How to use this module.

## Preparing lighting console/onPC  

### Instructions for grandMA2

If you have not used the MA2 Web Remote before, you will need to enable it first.

Enable it by setting `Setup > Console > Global Settings > Remotes` to `Login Enabled` 
<img width="520" alt="image" src="https://github.com/user-attachments/assets/d5798959-fbc4-4734-8d3f-a0d23b09200c" />

By default, the module is configured to login with the user `chataigne` and the password `chataigne`.  
Either create this user profile, or use your own / an existing one by changing the modules default login settings.  

To create / manage a user account in MA2, go to `Setup > Console > User & Profiles Setup`.  
<img width="520" alt="image" src="https://github.com/user-attachments/assets/e9935c28-476a-48a4-88e6-4dd1c7df8b5b" />

In this section you can also monitor / verify that the module is connecting correctly.  
<img width="520" height="151" alt="image" src="https://github.com/user-attachments/assets/8fcb885f-1c5f-46ec-899a-485ee5129894" />  
When starting a session, the logged in count should increase for the configured user.  
If it stays on `guest` the login process did not succeed and the session will die after a short time period.  
You will also be dropped when you don't wait for GrandMA2 to fully start and let it create it's internal session first.

### Instructions for dot2
1. Click [Setup] > Show > **Global Settings**
2. Enable **Web Remote**
3. The default password is "remote", and Chataigne will default to this password. If you want to change this for more security, next to Web Remote Password, click **Change** and enter your new password.

## The Parameters section  

## Basic Settings
<img width="468" height="49" alt="image" src="https://github.com/user-attachments/assets/3f3fbf97-11ab-44f8-a96b-1e613676dfc9" />

- **Server Path:**  
     If onPC is on the same PC it should just work, otherwise change to the target console/onPC IP. `<console ip>:80/?ma=1`
- **Connected:**  
     If the IP is valid and the target can be reached, this should light up.  

## Session

This Section is responsible for starting / stopping the connection to grandMA2/dot2.  
This will need to be done every time a session timed out (Showfile changed, console/onPC restarted, network interrupted, Chataigne started).  

<img width="466" height="144" alt="image" src="https://github.com/user-attachments/assets/7aef7ca9-565d-4217-94aa-0f37491e257d" />   
   
- **Status:**  
     Indicates the current session state.  
- **Session ID:**  
     This should tick up with every Session Login, untill MA2/dot2 has restarted and gets reset.  
     If this ever reads -2, too many active connection requests have been made and the limit has been reached. (3 Max)
     This should reset once users leave of sessions time out.
  
- **Start Session:**  
     To join the current grandMA2/onPC session of the Web Remote.  
- **End Session:**  
     Logout user from Session and terminate connection.  

   
 - **Credentials:**  
     If you do not use the default credentials specified above under "Preparing lighting console/onPC", you can  configure the login details here.  
     <img width="456" height="74" alt="image" src="https://github.com/user-attachments/assets/64c1a1f9-244f-443b-bed6-968d2f8e6dbf" />   
     ***Defaults***
	 - grandMA2
		 - User: `chataigne`
		 - Password: `e31b120e31610e45bcc5d7e1e5d00290` ("chataigne", MD5-encoded)
	 - dot2
		 - Password: `2c18e486683a3db1e645ad8523223b72` ("remote", MD5-encoded)

     **Please note**:  The password field needs to be a MD5 hash of the password you set in the console/onPC.  
     You can use any [MD5 hash generator](https://www.md5hashgenerator.com) to generate the hash of the password. (Be careful not to include extra spaces!)  

## The Playbacks section

In this Section you configure which executors you want to request from the console/onPC.  
- **Request Playbacks:**  
     Enable to actively request data from the console/onPC, if you only intend to SEND this can be off.  

### The Dynamic and Static config sections.  

1. In the Dynamic section you configure Faders and Buttons to request in **relativity** to the **Active Page**. 
     <img width="456" height="162" alt="image" src="https://github.com/user-attachments/assets/e31fc6bb-538f-45d9-8b6c-a3fd86dca0df" />  

     - **Active Page:**  
       Specifies the page you want to request playbacks for.  
       This is the value you want to reference / change for any kind of relative actions/mappings.  

     - **Sync to MA2:**  
          Enabling this will cause the module to send a page change request when ever you change the Active Page number to keep in sync.
   
     - **Faders / Buttons:**  
          The default example config shows how you can request faders x.001 - x.005 and x.006 - x.015 where x represents the page set as **Active Page**  
          While the example `1-5;6-15` works, the simpler and expected way to request x.001 to x.015 would be `1-15`.  
          By using `;` you rather specifiy blocks that have separation in between each other, for example `1-15;61-75`  

          Generally, faders go from 1-90, Buttons go from 101-190.  
          Requesting any outside this range can/will lead to undesired behaviour.  
     
          If you do not need a specific field, leave it blank.  
          ⚠️Make sure it is indeed blank and not a space.⚠️
       
          The more you request the higher the processing load will be.  
          Only request what you really need, to not waste resources.   

     - **Fader / Button Intervall:**  
          This specifices the time between requests, a longer intervall is less resource heavy.  
          The defaults should work well for many cases, but can be adjusted in steps of 20ms each.  
     
          You want to keep this as high as is tollerable for your application.  
          The faster you request the more it increases processing load exponentially.  

2. The Static section works slightly different.  
     <img width="456" height="118" alt="image" src="https://github.com/user-attachments/assets/de115b48-786a-45e7-826b-881bcdb289a8" />

     **Faders/Buttons** and **Fader Intervall / Button Intervall** function ***nearly*** identical.  
     By default we are not requesting any Faders however, you might notice that there is a 2. before each range in the Buttons config.  

     The Static section can be best though of like classic hardcoded MIDI Mappings.  
     Faders / Buttons in this section **REQUIRE** a page prefix before the range, telling it which specific page you want the executors from.  
     These pages will not be influenced by **Active Page** and get processed into dedicated static value fields for each page.  

     Like before, **Faders** go from 1-90 and **Buttons** go from 101-190.  
     The syntax is: `Page.Start-End`, so if you want **Buttons** 101 - 115 from Page 2, you put `2.101-115`.  
     Just like in the dynamic section, you can use `;` to define multiple executor blocks.  
     Example: `2.101-115;2.131-145;3.101-130`  
     You need to include the page prefix at the start of every block you define.  
     
     Note: All blocks referencing the same page get combined into a single request, but different pages will be separate data requests for each.

## Values
Here is where the data we are requesting is ending up in.  
1. **Executors:**  
     <img width="466" height="82" alt="image" src="https://github.com/user-attachments/assets/b2a299f6-a497-466f-95b2-447b935c5d31" />  
     Here is where our requested playbacks end up in.

     **Active Page:**  
          This is where all executors defined in the **Dynamic** sections will generate and update their data elements in.  
          When you change **Active Page** the same elements will be updated with the new incomming data of the selected page.  
          
     **Page1, Page2, Page3...**  
          Playbacks from the **Static** section will generate separate page entries for each page and their respective Executors here.  
          These pages will always contain the same Executors, regardless of what **Active Page** you are on.  

     ### Datablocks
     **Fader** datablocks contain this data:  
          <img width="407" height="834" alt="image" src="https://github.com/user-attachments/assets/5601ab30-24e4-4a99-a730-cba14840b9ad" />  
 

     While **Button** datablocks contain this data:  
          <img width="407" height="658" alt="image" src="https://github.com/user-attachments/assets/f6de1800-5e66-48fa-9acf-ca69668ba7fc" />  


     
3. Internal  
     <img width="466" height="22" alt="image" src="https://github.com/user-attachments/assets/8a7b8f42-d457-4b96-950b-9159a02df509" />  
     This section contains various debugging / internal API data.  
