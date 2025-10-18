import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { ActivePage } from "@lib/store";
import ControlPage from "@components/pages/ControlPage";
import SettingsPage from "@components/pages/SettingsPage";
import JoysticksPage from "@components/pages/JoysticksPage";

type AppState = {
  activePage: ActivePage | null;
}

const setActivePage = async (page: ActivePage) => {
  await invoke('set_active_page', { page });
};

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      activePage: ActivePage.Control,
    }
  }

  async componentDidMount(): Promise<void> {
    listen<number>('current-page', (event) => {
      this.setState({ activePage: event.payload })
    })
  }

  async componentWillUnmount(): Promise<void> {
    await unregisterAll();
  }

  render(): React.ReactNode {
    let body;
    switch (this.state.activePage) {
      case ActivePage.Control:
        body = (<ControlPage />);
        break;
      case ActivePage.Config:
        body = (<SettingsPage />);
        break;
      case ActivePage.Joysticks:
        body = (<JoysticksPage />);
        break;
      default:
        body = (<>Undefined Page</>);
        break;
    }
    return (<>
      <ul className="nav nav-tabs user-select-none">
        <li className="nav-item">
          <a href="#"
            className={`nav-link ${this.state.activePage == ActivePage.Control ? "active" : "text-light"}`}
            onClick={() => setActivePage(ActivePage.Control)}>Control</a>
        </li>
        <li className="nav-item">
          <a href="#"
            className={`nav-link ${this.state.activePage == ActivePage.Config ? "active" : "text-light"}`}
            onClick={() => setActivePage(ActivePage.Config)}>Config</a>
        </li>
        <li className="nav-item">
          <a href="#"
            className={`nav-link ${this.state.activePage == ActivePage.Joysticks ? "active" : "text-light"}`}
            onClick={() => setActivePage(ActivePage.Joysticks)}>Joysticks</a>
        </li>
      </ul>
      {body}
    </>)
  }
}

export default App;
