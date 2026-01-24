# Contributing to Ballistic

Thank you for your interest in contributing to Ballistic! We welcome contributions from everyone, whether you're fixing a bug, adding a feature, or improving documentation.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- Git
- A GitHub account

### Setting Up Your Development Environment

1. **Fork the repository**
   - Go to the [Ballistic repository](https://github.com/YOUR_USERNAME/ballistic)
   - Click the "Fork" button in the top-right corner
   - This creates a copy of the repository in your GitHub account

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ballistic.git
   cd ballistic
   ```

3. **Add the upstream remote**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/ballistic.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app running.

## How to Contribute

### Finding Something to Work On

- **Browse the issues**: Check the [Issues](https://github.com/YOUR_USERNAME/ballistic/issues) tab for open issues
- **Look for "good first issue" labels**: These are great for beginners
- **Create a new issue**: If you've found a bug or have a feature idea, create an issue to discuss it first

### Making Changes

1. **Create a new branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix-name
   ```

   Use descriptive branch names like `feature/add-dark-mode` or `fix/drag-drop-bug`

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments where necessary
   - Keep commits focused and atomic

3. **Test your changes**

   ```bash
   ./runtests.sh
   ```

   Make sure all tests pass before submitting your pull request.

4. **Write tests for new features**
   - Add tests in the `src/__tests__/` directory
   - Follow the existing test patterns
   - Ensure your new feature has adequate test coverage

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add dark mode toggle"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for adding or updating tests
   - `refactor:` for code refactoring
   - `style:` for formatting changes
   - `chore:` for maintenance tasks

6. **Keep your fork up to date**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting a Pull Request

1. **Go to your fork on GitHub**
   - You should see a "Compare & pull request" button

2. **Fill out the PR template**
   - Provide a clear title and description
   - Reference any related issues (e.g., "Closes #123")
   - Describe what changes you made and why
   - Add screenshots for UI changes

3. **Wait for review**
   - A maintainer will review your PR
   - They may request changes or ask questions
   - Be patient and responsive to feedback

4. **Make requested changes**
   - Make changes in your branch
   - Commit and push them
   - The PR will automatically update

5. **PR gets merged!**
   - Once approved, a maintainer will merge your PR
   - Congratulations, you're a contributor! 🎉

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing code formatting (we use ESLint)
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex functions
- Use Australian English spelling in documentation

## Testing Guidelines

- Write tests for all new features
- Ensure existing tests still pass
- Aim for good test coverage
- Test edge cases and error conditions
- Run `./runtests.sh` before submitting

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments to new functions
- Update CHANGELOG.md with your changes (maintainers will handle versioning)
- Keep documentation clear and beginner-friendly

## Need Help?

- Comment on the issue you're working on
- Ask questions in your pull request
- Don't be afraid to ask for help—we're all learning!

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Provide constructive feedback
- Focus on the code, not the person
- Have fun and learn together!

## Recognition

All contributors will be recognised in the project. Your contributions, no matter how small, are valued and appreciated!

Thank you for contributing to Ballistic! 🚀
