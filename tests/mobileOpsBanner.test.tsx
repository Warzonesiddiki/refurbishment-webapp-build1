import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileOpsBanner } from "@/components/mobile/MobileOpsBanner";

describe("MobileOpsBanner", () => {
  it("renders live status region", () => {
    render(<MobileOpsBanner lanHintUrl="http://192.168.x.x:5173" theme="pro" />);
    expect(screen.getByText(/mode:/i)).toBeTruthy();
  });

  it("renders lan URL and copy action", () => {
    render(<MobileOpsBanner lanHintUrl="http://192.168.x.x:5173" theme="cyber" />);
    expect(screen.getByText(/192\.168\.x\.x:5173/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy url/i })).toBeTruthy();
  });
});
