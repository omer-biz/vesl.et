import { GitHubCalendar } from 'react-github-calendar';

export default function GithubTracker() {
  const vesselTheme = {
    light: ['#e7e5e4', '#ccfbf1', '#5eead4', '#14b8a6', '#0d9488'], // stone-200 to teal-700
    dark: ['#292524', '#0d9488', '#14b8a6', '#5eead4', '#ccfbf1'],
  };

  return (
    <div className="w-full">
      <GitHubCalendar
        username="omer-biz"
        theme={vesselTheme}
        fontSize={12}
        blockSize={11}
        blockMargin={4}
      />
    </div>
  );
}
