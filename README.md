[![npm](https://img.shields.io/npm/v/nx-dynamic-mf?color=%2300d26a&style=for-the-badge)](https://www.npmjs.com/package/nx-dynamic-mf)
[![Sonar Quality Gate](https://img.shields.io/sonar/quality_gate/LoaderB0T_nx-dynamic-mf?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/summary/new_code?id=LoaderB0T_nx-dynamic-mf)

# nx-dynamic-mf

Nx helper for [ng-dynamic-mf](https://www.npmjs.com/package/ng-dynamic-mf)

## Motivation 💥

This plugin provides a way to conviniently use the [ng-dynamic-mf](https://www.npmjs.com/package/ng-dynamic-mf) library in Nx workspaces.

## Features 🔥

✅ Start up the whole workspace with a single command (`nx construct`)

✅ Supports multiple `modules.json` files in the workspace (`modules.something.json`)

✅ Supports serving and building of apps (auto detection based on `modules.json`)

✅ Supports `--watch` flag for building apps

More features including generators and more to come...

## Built With 🔧

- [TypeScript](https://www.typescriptlang.org/)
- [Nx](https://nx.dev/)

## Getting Started 🚀

### Install

npm

```bash
npm install -D nx-dynamic-mf
```

yarn

```bash
yarn add -D nx-dynamic-mf
```

### Add to Workspace

Add a new target to your host app:

```json
{
  "targets": {
    "construct": {
      "builder": "nx-dynamic-mf:construct",
      "options": {
        "modulesFolder": "src/modules"
      }
    }
  }
}
```

### Try it out

```bash
  nx construct
```

### Additional Options

Use a different `modules.json` file:

```bash
  nx construct -m example
```

This will use the `modules.example.json` file instead of the default `modules.json` file.

---

Watch certain projects for changes and rebuild them:

Watch all builds:

```bash
  nx construct --watch
```

Watch certain builds:

```bash
  nx construct --watch proj1
```

or

```bash
  nx construct --watch proj1 --watch proj2
```

or

```bash
  nx construct --watch proj1,proj2
```

---

## Contributing 🧑🏻‍💻

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 🔑

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact 📧

Janik Schumacher - [@LoaderB0T](https://twitter.com/LoaderB0T) - [linkedin](https://www.linkedin.com/in/janikschumacher/)

Project Link: [https://github.com/LoaderB0T/ng-dynamic-module-federation](https://github.com/LoaderB0T/ng-dynamic-module-federation)
