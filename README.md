# Predictio

Predictio is a scoring application for the trick-taking card game **Prediction**.

The app allows players to record games, keep track of scores, view past matches, and see game results over time. It is designed to make scoring easier while keeping a history of games and winners.

## Features

- Record new games and player scores
- Track game history
- View previous winners
- Store data locally on the device
- Android application built from web technologies

## Tech stack

- [Vue](https://vuejs.org/) — frontend framework
- [Capacitor](https://capacitorjs.com/) — mobile app packaging and native integration

The application is currently local-only and does not require an account or an internet connection.

## Project status

Predictio is currently in active development, although the scope of the first version has been intentionally kept focused.

Planned improvements include:

- More detailed player statistics:
  - Prediction success rate
  - Average number of predicted tricks
  - Player performance over time
- A self-hosted backend to:
  - Synchronize data between devices
  - Share players and games between users
  - Provide cross-device statistics

## Development

### Prerequisites

- Node.js
- npm
- Android Studio (for Android builds)

### Install dependencies

```bash
npm install
