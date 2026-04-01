import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { ActivePage } from "@lib/ipc";
import OverviewPage from "@components/pages/OverviewPage";
import SettingsPage from "@components/pages/SettingsPage";
import InputPage from "@components/pages/InputPage";

type AppState = {
  activePage: ActivePage | null;
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);
    this.state = { activePage: null }
  }
  async setActivePage(page: ActivePage) {
    this.setState({ activePage: page })
    await invoke('set_active_page', { page });
  };

  async componentDidMount(): Promise<void> {
    await invoke("console_init");
    let activePage = await invoke<number>("get_active_page");
    this.setState({ activePage })
  }

  render(): React.ReactNode {
    let body;
    switch (this.state.activePage) {
      case ActivePage.Overview:
        body = (<OverviewPage />);
        break;
      case ActivePage.Settings:
        body = (<SettingsPage />);
        break;
      case ActivePage.Input:
        body = (<InputPage />);
        break;
      default:
        body = (<>Undefined Page</>);
        break;
    }
    return (<>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <a href="#"
            className={`nav-link ${this.state.activePage == ActivePage.Overview ? "active" : "text-light"}`}
            onClick={async () => { this.setState({ activePage: ActivePage.Overview }); await invoke('set_active_page', { page: ActivePage.Overview }) }}>Overview</a>
        </li>
        <li className="nav-item">
          <a href="#"
            className={`nav-link ${this.state.activePage == ActivePage.Settings ? "active" : "text-light"}`}
            onClick={async () => { this.setState({ activePage: ActivePage.Settings }); await invoke('set_active_page', { page: ActivePage.Settings }) }}>Settings</a>
        </li>
        <li className="nav-item">
          <a href="#"
            className={`nav-link ${this.state.activePage == ActivePage.Input ? "active" : "text-light"}`}
            onClick={async () => { this.setState({ activePage: ActivePage.Input }); await invoke('set_active_page', { page: ActivePage.Input }) }}>Input</a>
        </li>
      </ul>
      {body}
    </>)
  }
}

export default App;
