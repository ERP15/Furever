import styled, { css } from "styled-components/native";

const TrafficLight = styled.View`
  border-radius: 50px;
  width: 10px;
  height: 10px;
  padding: 10px;

  ${(props) =>
    props.available &&
    css`
      background: #51CF66;
    `}

  ${(props) =>
    props.limited &&
    css`
      background: #FFD43B;
    `}

    ${(props) =>
    props.unavailable &&
    css`
      background: #FF8C42;
    `}
`;

export default TrafficLight;