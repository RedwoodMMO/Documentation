---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Running with the Backend

## Launching the Backend

:::warning
Currently the **Standard License** option only works for Windows development machines. We're working on getting MacOS and Linux supported.
:::

<Tabs>
  <TabItem value="standard" label="Standard License" default>
    Open a terminal and navigate to the `RedwoodBackend` directory. Run the below command after replacing `<your-config-env>` with the name of the config folder you created earlier:

    ```bash
    ./dev-initiator-win <your-config-env>
    ```

    :::info
    The specific syntax of whether you include the `./` or not may be dependent on your terminal.

    macOS and Linux users can use `dev-initiator-mac` and `dev-initiator-lin` instead, respectively.
    :::
  </TabItem>
  <TabItem value="custom" label="Custom License">
    You can run the Dev Initiator with running the below command in the `RedwoodBackend` directory:

    ```bash
    yarn dev <config-environment>
    ```

    **For example**: `yarn dev project-name`.
  </TabItem>
</Tabs>

Several logs will print to the console as the backend initializes; wait until you see `All services ready`.

## Running the Game

<Tabs>
  <TabItem value="match" label="Match Template" default>
    It's time to start the game, connect to the backend, and join a match!

    1. Once the project is created and shaders are compiled, you will see the default Lyra level selected:

        ![Match Template Default Level](/img/match-open-new-project.jpg)

    1. Open the Content Browser and open the level `/Content/Redwood/Frontend/L_RW_LyraFrontEnd`:

        ![Match Template open Redwood Frontend Level](/img/match-open-rw-level.jpg)

    1. Make sure you've selected `Play Standalone` under the PIE **Net Mode** (it's the default) and are still in the `L_RW_LyraFrontEnd` level:

        ![Match Template select standalone](/img/match-play-standalone.jpg)

    1. Press the green play button:

        ![Match Template play button](/img/match-play.jpg)

    1. You should see the Lyra frontend widget with the `LOGIN`/`REGISTER` buttons enabled:

        ![Match Template frontend](/img/match-frontend.jpg)

        :::warning
        If you see these buttons greyed out/disabled and a label saying `Connecting to backend...`, there are some a few common issues:
        - You have another application bound to the port `3001`
        - You did not configure your [`hosts` file](./installing.md#configure-hosts-file) properly to include `director.localhost`
        - You started PIE before the Dev Initiator hasn't finished initializing. The connection retry logic will get exponentially slower after each retry, so you may need to restart PIE
        :::

    1. Register to create an account; any username/password works here. We use `test` and `test` for quick iteration.
    1. Login using the same username/password. The `Remember Me` functionality is part of the Redwood plugin. It will save a `RedwoodSaveGame.sav` file in the `SaveGames` folder with an authentication token to automatically login when the game starts the next time.

        :::warning
        If you were able to register but the login process seems to hang for more than 5 seconds, you're likely having issues connecting to the Realm Frontend service. The common issues for that are similar:
        - You have another application bound to the port `3011`
        - You did not configure your [`hosts` file](./installing.md#configure-hosts-file) properly to include `realm-default.localhost`
        :::

    1. You should be able to see a `PLAY` button now:

        ![Match Template logged in](/img/match-logged-in.jpg)

    1. Select `PLAY`; from here, you can either select `MATCHMAKING` or `START LOBBY` to create a match. The `JOIN LOBBY` button will show a list of existing public lobbies.

        :::note
        It may take awhile for the server to load the first time. You may get a timeout and need to try again. If your ticket keeps going stale, you can increase the `ticket-stale-time-ms` variable you [set earlier](#initial-configuration) and restart the Dev Initiator.
        :::

        <video alt="Match Template example cycle" controls width="100%" height="auto">
          <source src="https://cdn.incanta.games/redwood/website/match-example-cycle.mp4" type="video/mp4"/>
          Your browser does not support the video tag.
        </video>

        :::info
        Server initialization is shorter in a packaged/cooked game. When running with the `local` [game server provider](../providers/game-server-hosting/overview.md), you're using uncooked content through `UnrealEditor.exe`. Using the `agones` game server provider will have the shortest initialization time due always having a warm server already started waiting to get the match details. Hathora's startup time is also quite fast, with their Enterprise tier having the best performance.
        :::
  </TabItem>
  <TabItem value="rpg" label="RPG Template">
    It's time to start the game, connect to the backend, start the overworld servers, and join!

    1. [Install NodeJS/Yarn](../deploying-to-kubernetes/prerequisites.md#nodejs) if you haven't yet

        :::info
        We need this extra dependency for persistent-server games since the server isn't started when matchmaking finds a match. Persistent games are assumed to already be started, so we need to use a provided tool to create and start that server before we try to join.
        :::

    1. Once the project is created and shaders are compiled, you will see the default L_Overworld level selected:

        ![RPG Template Default Level](/img/rpg-open-project.jpg)

    1. Open the Content Browser and open the level `/Content/Maps/L_Title`:

        ![RPG Template open Frontend Level](/img/rpg-open-title-level.jpg)

    1. Make sure you've selected `Play Standalone` under the PIE **Net Mode** (it's the default) and are still in the `L_RW_LyraFrontEnd` level:

        ![RPG Template select standalone](/img/rpg-play-standalone.jpg)

    1. Press the green play button:

        ![RPG Template play button](/img/rpg-play.jpg)

    1. You should see the frontend widget with the `REGISTER`/`LOGIN` buttons enabled:

        ![RPG Template frontend](/img/rpg-frontend.jpg)

        :::warning
        If you see these buttons greyed out/disabled and a label saying `Connecting to backend...`, there are some a few common issues:
        - You have another application bound to the port `3001`
        - You did not configure your [`hosts` file](./installing.md#configure-hosts-file) properly to include `director.localhost`
        - You started PIE before the Dev Initiator hasn't finished initializing. The connection retry logic will get exponentially slower after each retry, so you may need to restart PIE
        :::

    1. Register to create an account; any username/password works here. We use `test` and `test` for quick iteration.
    1. Login using the same username/password.

        :::warning
        If you were able to register but the login process seems to hang for more than 5 seconds, you're likely having issues connecting to the Realm Frontend service. The common issues for that are similar:
        - You have another application bound to the port `3011`
        - You did not configure your [`hosts` file](./installing.md#configure-hosts-file) properly to include `realm-default.localhost`
        :::

    1. You should be able to see a dropdown and be able to create a character:

        <video alt="RPG Template create character" controls width="100%" height="auto">
          <source src="https://cdn.incanta.games/redwood/website/rpg-create-character.mp4" type="video/mp4"/>
          Your browser does not support the video tag.
        </video>

    1. Before you can join the server, we need to create it:

        1. Open a terminal to the `RedwoodBackend` directory
        1. Create an admin user (changing the env arg to your config environment name):

            ```bash
            yarn cli create-admin admin --env project-name
            ```

            :::note
            You'll be prompted for a password for this new user, but you can optionally set the `RW_PASSWORD` environment variable to skip manually entering it each time.
            :::

        1. Start a [GameServerProxy](../architecture/game-servers.md#gameserverproxy) using the [preconfigured](./installing.md#initial-configuration) `overworld` [game profile](../configuration/game-modes-and-maps.md#profiles) (changing the env arg to your config environment name):

            ```bash
            yarn cli create-proxy overworld overworld --user admin --env project-name --start-on-boot --proxy-ends --public
            ```

            :::note
            The `--start-on-boot` flag will not only start this proxy when the backend boots up (and it hasn't ended), it will also start it immediately. Only admin users can specify this flag.

            The `--proxy-ends` flag will end the GameServerProxy when the backing GameServerCollection ends. You typically wouldn't set this for production realms/worlds as you'd want to keep them around perpetually even if the servers stop temporarily (i.e. during a game server upgrade). However, often times in development, it may be beneficial to start with a clean slate world each time we restart it, hence specifying it here.

            Starting this up will automatically run a shard/server for each of the zones (5 for this template). This involves running the UnrealEditor.exe for each shard, which can consume a bit of RAM (~1.2GB for each shard).
            :::

    1. Once the terminal says `Proxy created successfully` you can press the `Join` button in Unreal to queue for the proxy/world and be admitted:

        <video alt="RPG Template queue into Overworld" controls width="100%" height="auto">
          <source src="https://cdn.incanta.games/redwood/website/rpg-queue-into-overworld.mp4" type="video/mp4"/>
          Your browser does not support the video tag.
        </video>

    1. The backend is using uncooked data from the Unreal assets for the servers running, so you can't modify any of the Unreal assets while the servers are still running. You can stop the GameServerProxy's backing GameServerCollection (aka each of the shard servers for the world) by running the below command in the `RedwoodBackend` terminal you had open before:

        ```bash
        yarn cli stop-proxy --user admin --env project-name <the-proxy-id-returned-from-the-start-proxy-command>
        ```

        For example, if your `start-proxy` command returned:

        ```
        [05:47:18.119] INFO (70364): Proxy created successfully: cm1ol7o270001xhxi5z3d7fw2
        ```

        then you would run:

        ```bash
        yarn cli stop-proxy --user admin --env project-name cm1ol7o270001xhxi5z3d7fw2
        ```

  </TabItem>
  <TabItem value="blank" label="Blank Template">
    1. In the Unreal project you created earlier, open the `/Content/Maps/L_Title` map.
    1. Change the **Net Mode** in the play settings to **Play Standalone**
    1. Optionally change the number of players to whatever you'd like. Below we'll just show the steps for a single player, but you can repeat them to get multiple players in the same match.
    1. Click the **Play** button
    1. You should now see the **Register**, **Login**, and **Quit** buttons:

        ![Title screen connected to the backend](/img/testing-match-connected.jpg)

        If you're stuck seeing the **Connecting to the director...** screen, make sure you've launched the `dev-initiator.exe` program, there are no errors, and double check any firewall/security prompts that may be preventing it from connecting.

        ![Title screen connecting to the backend](/img/testing-match-failing-to-connect.jpg)

        :::note
        If you're still having trouble connecting, make sure you don't have other applications using conflicting ports. The Redwood backend by default runs on ports `3000` and `3001`. These config variables can be changed by adding them to the `_index.yaml` file you created [earlier](#configuring-the-backend). Below is what you can add to the end of the file; change the ports respectively:

        ``` yaml
        director:
          connection:
            backend:
              port: 3000
            frontend:
              port: 3001

        realm:
          connection:
            backend:
              game-server-access:
                port: 3000
        ```

        You would also need to change the port in the **Director Address** variable in the **Class Defaults** section of the **B_TitlePlayerController** blueprint in `/Content/GameFramework` using the `director.connection.frontend.port` config variable you specified above.
        :::

    1. Click the **Register** button and enter a username and password. If that's successful, you'll be automatically logged in and see the character selection screen. Press the `+` button to create a new character:

        ![Character selection screen](/img/testing-match-character-selection.jpg)

    1. Enter a character name and click **Create**. You'll be taken back to the character selection screen. You should see your new character in the drop down menu:

        ![Character selection screen](/img/testing-match-character-selection-1.jpg)

    1. After selecting your character, click the **Join** button to join the matchmaking queue:

        ![Joining queue](/img/testing-match-joining-queue.jpg)

        ![Match found](/img/testing-match-match-found.jpg)

        ![Server allocated](/img/testing-match-server-allocated.jpg)

    1. If you're seeing the below error, you didn't correctly [configure the backend](./installing.md#initial-configuration) to point to your project:

        ![Server allocation error](/img/testing-match-invalid-project.jpg)

    1. If everything was configured properly, any clients that signed up before should be put into a match. The **Blank** template has a simple match where players can move around as a floating cube with WASD and the mouse.

        ![In a match](/img/testing-match-in-match.jpg)
  </TabItem>
</Tabs>

:::success
That's it! You're using Redwood to start your servers and route clients into those servers via matchmaking or queueing! Let's learn how to run things [**without the backend running**](./running-without-backend.md) for faster development iterations.
:::