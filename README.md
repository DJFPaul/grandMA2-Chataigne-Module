# A [Chataigne](https://github.com/benkuper/Chataigne) Module for interfacing with grandMA2
---

### Pre-Release repository as placeholder for linking and starting documentation.  
#### Expect initial first module release in February.  


---
### ⚠️ Below documentation is pre-release and work in progress.  ⚠️
---





This module mimics a [Web Remote](https://help.malighting.com/grandMA2/en/help/key_remote_control_web_remote.html) to interface with grandMA2.  

## Features

🐌 Using a FPS filter to limit the maximum rate of any send mappings is highly recommended.  
#### Sending
- Send command (String)
- Send executor fader value (Float)*
- Send executor button state (Bool)
- Change executor Label (String)
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
 
## Setting up grandMA2  

If you have not used the MA2 Web Remote before, you will need to enable it first.

Enable it by setting `Setup > Console > Global Settings > Remotes` to `Login Enabled` 
<img width="812" height="488" alt="image" src="https://github.com/user-attachments/assets/d5798959-fbc4-4734-8d3f-a0d23b09200c" />

By default, the module is configured to login with the user `chataigne` and the password `chataigne`.  
Either create this user profile, or use your own or an existing one by changing the modules default login settings.  

To create / manage a user account in MA2, go to `Setup > Console > User & Profiles Setup`.  
<img width="731" height="445" alt="image" src="https://github.com/user-attachments/assets/d5903138-d628-4ef3-9e6e-2ec3bc138a89" />  

Please note that the password field in the Module needs to be a MD5 hash of the password you set in MA2.  
You can use any [MD5 hash generator](https://www.md5hashgenerator.com) to generate the hash of the password. (Careful not to include extra spaces!)  

In this section you can also later monitor / verify that the module is connected correctly.  
<img width="727" height="151" alt="image" src="https://github.com/user-attachments/assets/c7c80507-b330-4dea-ab0d-9410dc9984af" />  
This should change from `guest` to your configured user, when the module logs into the session.  
