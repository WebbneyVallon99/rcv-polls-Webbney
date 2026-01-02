# Ranked Choice Voting App, Part 2

This project-based assignment is intended to stretch your ability to build a project from scratch (or, mostly from scratch) using AI coding tools such as ClaudeCode and Cursor.

During the Summer term, you built a ranked-choice voting app in teams over the course of two weeks. This week, you'll build a version of this same app, but instead of relying on teammembers, you'll be building it solo, with the aid of agentic AI tools, such as Claude Code and Cursor.

## Getting Started

The starting point for this project is divided into /frontend and /backend folders, each of which is a separate NPM app.

To install NPM packages, do something like the following:

1. `cd backend && npm install`
2. `cd ../frontend && npm install`

## Requirements

By the end, your project should be able to do the following things:

- Users should be able to create polls with different options
- Once they publish these polls, they should be able to generate links to share with others.
- If someone else (a "voter") clicks on this link, they can rank the poll options in order (e.g. first choice, second choice, etc) and submit their "ballot."
- Once the creator of the poll closes the poll, all the ballots are tallied up using the [instant runoff voting algorithm](https://en.wikipedia.org/wiki/Instant-runoff_voting).
- You DO NOT need to deploy this app. Running it locally is fine.
- The app must be thoroughly tested (see )

There is A LOT of ambiguity in the above-listed requirements. It is your job to narrow down the specifications of the project through experimentation.
