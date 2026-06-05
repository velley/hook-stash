import React from "react";
import { $, createComponent, render, useInjector, useSignal } from "../../packages";
import { useAppData } from "../hooks/useAppData";

const cardStyle: React.CSSProperties = {
  border: "1px solid #999",
  margin: "10px 0",
  padding: "12px",
  borderRadius: "8px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  marginTop: "8px",
};

export const ProfileName = () => {
  const { name } = useInjector(useAppData);
  console.log("ProfileName component executed");

  return render(() => (
    <div style={cardStyle}>
      <strong>NamePanel</strong>
      <div>name: {name()}</div>
    </div>
  ));
};

export const ProfileAge = () => {
  const { age } = useInjector(useAppData);
  console.log("ProfileAge component executed");

  return render(() => (
    <div style={cardStyle}>
      <strong>AgePanel</strong>
      <div>age: {age()}</div>
    </div>
  ));
};

export const ProfileCity = () => {
  const { city } = useInjector(useAppData);

  return render(() => (
    <div style={cardStyle}>
      <strong>CityPanel</strong>
      <div>city: {city()}</div>
    </div>
  ));
};

export const ProfileSummary = () => {
  const { name, age, city } = useInjector(useAppData);

  return render(() => (
    <div style={cardStyle}>
      <strong>SummaryPanel</strong>
      <div>
        summary: {name()} / {age()} / {city()}
      </div>
    </div>
  ));
};

export const ProfileEditor = () => {
  const { changeName, increaseAge, changeCity, changeAppData } = useInjector(useAppData);
  const [draftName, setDraftName] = useSignal("alice");
  const [draftCity, setDraftCity] = useSignal("Hangzhou");

  return render(() => (
    <div style={cardStyle}>
      <strong>EditorPanel</strong>
      <div style={rowStyle}>
        <input
          value={draftName()}
          placeholder="change name"
          onChange={(e) => setDraftName(e.target.value)}
        />
        <button onClick={() => changeName(draftName())}>更新 name</button>
      </div>

      <div style={rowStyle}>
        <input
          value={draftCity()}
          placeholder="change city"
          onChange={(e) => setDraftCity(e.target.value)}
        />
        <button onClick={() => changeCity(draftCity())}>更新 city</button>
      </div>

      <div style={rowStyle}>
        <button onClick={increaseAge}>age + 1</button>
        <button onClick={() => changeAppData("bob", 26, "Shenzhen")}>批量更新</button>
      </div>
    </div>
  ));
};

export const SignalRenderDemo = () => {
  const [name, setName] = useSignal("张三");
  const [gender, setGender] = useSignal(0);

  const genderLabel = () => {
    switch (gender()) {
      default:
        return "未知";
      case 0:
        return "女";
      case 1:
        return "男";
    }
  };

  return render(() => (
    <div style={cardStyle}>
      <strong>SignalRenderDemo</strong>
      <p>姓名：{name()}</p>
      <p>性别：{genderLabel()}</p>

      <div style={rowStyle}>
        <input
          placeholder="更改姓名"
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => setGender(1)}>设为男</button>
        <button onClick={() => setGender(0)}>设为女</button>
      </div>
    </div>
  ));
};

export const DollarRenderDemo = () => {
  const { name, age } = useInjector(useAppData);

  return (
    <div style={cardStyle}>
      <strong>$ helper demo</strong>
      <div>name: {$(name)}</div>
      <div>age next year: {$(age, (value) => value + 1)}</div>
    </div>
  );
};

const DemoA = () => {
  return (
    <div>
      <h3>DI + shared state + render demo</h3>
      <ProfileName />
      <ProfileAge />
      <ProfileCity />
      <ProfileSummary />
      <ProfileEditor />
      <DollarRenderDemo />
      <SignalRenderDemo />
    </div>
  );
};

export default createComponent(DemoA, [useAppData]);
