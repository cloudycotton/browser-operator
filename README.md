<div align="center">

### Browser Operator

Build your own AI operators like OpenAI

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![Discord](https://img.shields.io/badge/discord-purple.svg)](https://discord.gg/3YfJeg7pNp)

https://github.com/user-attachments/assets/a7196eef-d3a0-401b-89aa-eb06f4a5f3d9

</div>

## 📦 Installation

```bash
npm install browser-operator
```

### Environment

The framework depends on the following environment variables:

- `ANTHROPIC_API_KEY` - API Key for Claude.

```shell
# Set the API key in the shell before running.
export ANTHROPIC_API_KEY=your-api-key
```

> Support for other models is coming. Please open an issue for models you want to see.

## 🔧 Usage

```ts
import { BrowserOperator } from "browser-operator";

const operator = await BrowserOperator.create();

const response = await operator.page.act(
  "go to hackernews, click on comments of top post, print the title and top comment."
);

await operator.stop();

console.log(response);
console.log(operator.page._generateScript()); // experimental script generation. Methods starting with _ are not stable.
```

## Terminal Usage

There is an included CLI tool that can be used to act on instructions from the command line or from a file.

```bash
# Pass the instruction from the command line
npx browser-operator "go to hackernews, click on comments of top post, print the title and top comment."

# Pass the instruction from a file
npx browser-operator instruction.txt

# Generate deterministic script of actions taken by the operator. This is experimental and may not work reliably. Next time, you run the same command with --generate-script flag, generated script will be run instead of operator.
npx browser-operator "go to hackernews, click on comments of top post, print the title and top comment." --generate-script

```

## 🙏 Acknowledgements

This project is heavily inspired by [StageHead](https://github.com/browserbase/stagehand).

## 📄 License

This project is licensed under the [MIT License](LICENSE).
