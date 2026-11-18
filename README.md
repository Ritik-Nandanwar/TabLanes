# TabLanes

**Auto Tab Groups by URL**

TabLanes automatically groups Chrome tabs using URL patterns you create. Give each group a name and color, then add one or more URL patterns. Matching tabs join the group automatically as they open; one matching tab is enough to create a group.

## Install TabLanes from GitHub

These steps install the extension manually in desktop Chrome. Chrome does not install an extension directly from a GitHub page.

1. Open the TabLanes GitHub repository.
2. Select the green **Code** button, then choose **Download ZIP**.
3. Open your Downloads folder. Right-click the downloaded ZIP and choose **Extract All…**. Extract it somewhere you can keep, such as Documents.
4. In Chrome, enter `chrome://extensions` in the address bar and press **Enter**.
5. Turn on **Developer mode** using the switch near the upper-right corner.
6. Select **Load unpacked**.
7. In the folder picker, open the extracted `TabLanes-main` folder (the name may vary), select the folder that contains `manifest.json`, and choose **Select Folder**.
8. TabLanes should now appear in Chrome’s extensions list. To make it easy to open, select the puzzle-piece **Extensions** button beside the address bar, then pin TabLanes.
9. Select the TabLanes icon. Enter a group name, add URL patterns (one per line), choose a color, and select **Create group**.

Example patterns for one group:

```text
https://www.youtube.com/*
https://youtu.be/*
```

Tabs matching either pattern will be placed in the same named and colored Chrome tab group. Earlier rules take precedence if URL patterns overlap. Use the edit icon beside a rule to change its name, patterns, or color; use the remove icon to delete it.

## Updating or removing the extension

To update, download and extract the latest repository ZIP. Copy the new files into the original extracted `TabLanes-main` folder, replacing the old files, then open `chrome://extensions` and select **Reload** on the TabLanes card. Keep using the same folder Chrome loaded. To remove the extension, choose **Remove** on the TabLanes card.

## Privacy and groups

TabLanes checks open tab URLs locally to match your rules. It stores the rules in Chrome’s local extension storage and does not send them to a server. It does not keep a history of closed groups or save tab groups as bookmarks. Chrome controls whether groups appear on the bookmarks bar; turn off **Show tab groups in bookmarks bar** under Chrome **Settings → Appearance** to hide them there.

## Note

This is an early prototype and requires desktop Chrome with tab grouping support. Because this is installed as an unpacked extension, Chrome may show a developer-mode notice and updates are manual.
