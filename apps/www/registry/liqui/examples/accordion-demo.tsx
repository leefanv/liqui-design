'use client';

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/registry/liqui/ui/accordion';

export default function AccordionDemo() {
  return (
    <Accordion className="max-w-md" defaultValue={['refraction']}>
      <AccordionItem value="refraction">
        <AccordionTrigger>What is actually being refracted?</AccordionTrigger>
        <AccordionPanel>
          <p>
            Whatever the surface is stacked on. The rim samples the backdrop inward through a
            displacement map, so edges behind the panel bend as they pass under the bezel.
          </p>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="resize">
        <AccordionTrigger>Does the map regenerate while it animates?</AccordionTrigger>
        <AccordionPanel>
          <p>
            Yes — the surface grows with the panel, and a new size means a new map. They are cached
            module-wide by size and optics, so an accordion that has been opened once reopens
            without regenerating anything.
          </p>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="stacking">
        <AccordionTrigger>Can I stack many of these?</AccordionTrigger>
        <AccordionPanel>
          <p>
            Within reason. Each item is its own backdrop-filter surface, and that is the cost that
            actually shows up in frame times. A long list of glass rows is the one layout worth
            profiling.
          </p>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
